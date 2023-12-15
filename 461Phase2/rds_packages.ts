// ALL FUNCTIONS IN THIS FOLDER ARE EXPORTED TO app.mjs
// TO RUN THESE FUNCTIONS, RUN app.mjs
import { QueryResult } from 'pg';
import { get_rds_connection, TABLE_NAME } from './rds_config';
import { logger, time } from './logger';
import { 
  PackageMetadata,
  PackageRating,
} from './package_objs'
import { Object } from 'aws-sdk/clients/panorama';

interface PackageData {
    package_id: number,
    package_name: string,
    rating: {
      BusFactor: number;
      RampUp: number;
      LicenseScore: number;
      Correctness: number;
      ResponsiveMaintainer: number;
      PullRequest: number;
      GoodPinningPractice: number;
      NetScore: number;
    },
    num_downloads: number,
    created_at: Date,
}

interface Row {
  id: string,
  name: string,
  version: string,
  rating: PackageRating,
  num_downloads: number,
  JSProgram: string | null | undefined,
} // This is a makeshift ORM, kind of a bandaid fix lol

function row_to_metadata(row: Row | null) : PackageMetadata | null {
  if (row === null) {
    return null
  }

  const metadata : PackageMetadata = {
    Name: row.name,
    Version: row.version,
    ID: row.id,
  }

  return metadata;
}

// Adds data to the amazon RDS instance. That data is assigned a unique ID that is returned.
// This ID is used to locate the package contents in the S3 bucket.
async function add_rds_package_data(metadata: PackageMetadata, rating: PackageRating, JSProgram: String | null) : Promise<string | null> {
  const client = await get_rds_connection();

  try {
      const query = `
        INSERT INTO package_data(name, version, id, rating, num_downloads, JSProgram) VALUES($1, $2, $3, $4, $5, $6)
        RETURNING id;
      `;
      const values = [metadata.Name, metadata.Version, metadata.ID, rating, 0, JSProgram]
      const result: QueryResult<Row> = await client.query(query, values);

      // Making sure something is returned at all
      if (result.rowCount == 0) {
        return null;
      }

      return result.rows[0].id;
    } catch (error) {
      logger.error('Error entering data:', error);
      return null;
    } finally {
      await client.end();
    }
}

async function update_rds_package_data(id: string, newName: string, newVersion: string, JSProgram: string | null): Promise<number | null> {
  const client = await get_rds_connection();
  let query:any;
  let values:any;

  try {
    if(JSProgram == "no") {
      query = `
        UPDATE package_data 
        SET name = $1, version = $2
        WHERE id = $3
      `;
      values = [newName, newVersion, id];
    } else {
      query = `
        UPDATE package_data 
        SET name = $1, version = $2, JSProgram = $3
        WHERE id = $4
      `;
      values = [newName, newVersion, JSProgram, id];
    }
    let result = await client.query(query, values);

    // Check if any rows were affected
    return result.rowCount;
  } catch (error) {
    logger.error('Error updating data:', error);
    return 0;
  } finally {
    await client.end();
  }
}

async function get_package_metadata(package_id: number) : Promise<any | null> {
  const client = await get_rds_connection();

  try {
      const query = `
        SELECT * FROM ${TABLE_NAME} WHERE id = $1
      `;
      const values = [package_id]
      const data: QueryResult<Row> = await client.query(query, values);

      // Making sure something is returned at all
      if (data.rowCount == 0) {
        return null;
      }

      let metadata = data.rows[0]

      if (metadata.JSProgram === null) {
        metadata.JSProgram = undefined;
      }

      return metadata;
    } catch (error) {
      logger.error('Error grabbing data:', error);
      return null;
    } finally {
      await client.end();
    }
}

async function get_package_rating(package_id: number) : Promise<PackageRating | null> {
  const client = await get_rds_connection();

  try {
      const query = `
        SELECT rating FROM ${TABLE_NAME} WHERE id = $1
      `;
      const values = [package_id]
      const data: QueryResult<Row> = await client.query(query, values);

      // Making sure something is returned at all
      if (data.rowCount == 0) {
        return null;
      }

      const rating : PackageRating = data.rows[0].rating;

      return rating;
    } catch (error) {
      logger.error('Error grabbing data:', error);
      return null;
    } finally {
      await client.end();
    }
}

async function match_rds_rows(regex: string, useExactMatch: boolean = false): Promise<any> {
  const client = await get_rds_connection();

  try {
      let query;
      if(useExactMatch) {
        query = `
            SELECT * FROM ${TABLE_NAME}
            WHERE name = $1;
        `;
      } else {
        query = `
            SELECT * FROM ${TABLE_NAME}
            WHERE name ~ $1;
        `;
      }
      const values = [regex]

      const result = await client.query(query, values);

      logger.debug('Query result:', JSON.stringify(result.rows));
  
      return result.rows;

    } catch (error) {
      logger.error('Error searching data:', error);
      return [];
    } finally {
      await client.end();
    }
}

async function match_rds_rows_with_pagination(regex: string, version: string, useExactMatch: boolean = false, offset: number = 0): Promise<any> {
  const client = await get_rds_connection();
  let limit = 2;

  try {
      let query;
      const values = [regex];

      if (useExactMatch) {
          query = `
              SELECT * FROM ${TABLE_NAME}
              WHERE name = $1
              AND version ~ $4
              LIMIT $2 OFFSET $3;
          `;
          values.push(limit.toString(), offset.toString(), version.toString());
      } else {
          query = `
              SELECT * FROM ${TABLE_NAME}
              WHERE name ~ $1
              AND version ~ $4
              LIMIT $2 OFFSET $3;
          `;
          values.push(limit.toString(), offset.toString(), version.toString());
      }

      const result = await client.query(query, values);

      logger.debug('Query result:', JSON.stringify(result));

      return result.rows;

  } catch (error) {
      logger.error('Error searching data:', error);
      return [];
  } finally {
      await client.end();
  }
}

async function delete_rds_package_data(id: string): Promise<boolean> {
  const client = await get_rds_connection();

  try {
    const query = `
      DELETE FROM package_data WHERE id = $1
      RETURNING id;
    `;
    const values = [id];
    const result: QueryResult<Row> = await client.query(query, values);

    // Checking if any rows were affected
    if (result.rowCount === 0) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error deleting data:', error);
    return false;
  } finally {
    await client.end();
  }
}

export {
    add_rds_package_data,
    get_package_metadata,
    get_package_rating,
    match_rds_rows,
    match_rds_rows_with_pagination,
    update_rds_package_data,
    delete_rds_package_data,
    PackageData,
}
