// ALL FUNCTIONS IN THIS FOLDER ARE EXPORTED TO app.mjs
// TO RUN THESE FUNCTIONS, RUN app.mjs
import { QueryResult } from 'pg';
import { get_rds_connection, TABLE_NAME } from './rds_config';
import { logger, time } from './logger';
import { 
  PackageMetadata,
  PackageRating,
} from './package_objs'

interface PackageData {
    package_id: number,
    package_name: string,
    rating: {
      busFactor: number;
      rampup: number;
      license: number;
      correctness: number;
      maintainer: number;
      pullRequest: number;
      pinning: number;
      score: number;
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
} // This is a makeshift ORM, kind of a bandaid fix lol

// Adds data to the amazon RDS instance. That data is assigned a unique ID that is returned.
// This ID is used to locate the package contents in the S3 bucket.
async function add_rds_package_data(metadata: PackageMetadata, rating: PackageRating) : Promise<string | null> {
  const client = await get_rds_connection();

  try {
      const query = `
        INSERT INTO package_data(name, version, id, rating, num_downloads) VALUES($1, $2, $3, $4, $5)
        RETURNING id;
      `;
      const values = [metadata.name, metadata.version, metadata.ID, rating, 0]
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

async function update_rds_package_data(name: string, rating: object, content: string, url: string, jsProgram: string): Promise<number | null> {
  const client = await get_rds_connection();

  try {
    const query = `
      UPDATE package_data
      SET rating = $2, content = $4, url = $5, js_program = $6
      WHERE package_name = $1
      RETURNING package_id;
    `;
    const values = [name, rating, 0, content, url, jsProgram];
    const result: QueryResult<PackageData> = await client.query(query, values);
    if (result.rowCount === 0) {
      return null;
    }

    return result.rows[0].package_id;
  } catch (error) {
    logger.error('Error updating data:', error);
    return null;
  } finally {
    await client.end();
  }
}

async function get_package_data(package_id: number) : Promise<PackageData | null> {
  const client = await get_rds_connection();

  try {
      const query = `
        SELECT * FROM ${TABLE_NAME} WHERE package_id = $1
      `;
      const values = [package_id]
      const data: QueryResult<PackageData> = await client.query(query, values);

      // Making sure something is returned at all
      if (data.rowCount == 0) {
        return null;
      }

      return data.rows[0];
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
            WHERE package_name = $1;
        `;
      } else {
        query = `
            SELECT * FROM ${TABLE_NAME}
            WHERE package_name ~ $1;
        `;
      }
      const values = [regex]

      const result = await client.query(query, values);

      logger.debug('Query result:', result.rows);
  
      return result.rows;

    } catch (error) {
      logger.error('Error searching data:', error);
      return [];
    } finally {
      await client.end();
    }
}

async function match_rds_rows_with_pagination(regex: string, useExactMatch: boolean = false, offset: number = 0): Promise<any> {
  const client = await get_rds_connection();
  let limit = 2;

  try {
      let query;
      const values = [regex];

      if (useExactMatch) {
          query = `
              SELECT * FROM ${TABLE_NAME}
              WHERE package_name = $1
              LIMIT $2 OFFSET $3;
          `;
          values.push(limit.toString(), offset.toString());
      } else {
          query = `
              SELECT * FROM ${TABLE_NAME}
              WHERE package_name ~ $1
              LIMIT $2 OFFSET $3;
          `;
          values.push(limit.toString(), offset.toString());
      }

      const result = await client.query(query, values);

      logger.debug('Query result:', result.rows);

      return result.rows;

  } catch (error) {
      logger.error('Error searching data:', error);
      return [];
  } finally {
      await client.end();
  }
}



export {
    add_rds_package_data,
    update_rds_package_data,
    get_package_data,
    match_rds_rows,
    match_rds_rows_with_pagination,
    PackageData,
}
