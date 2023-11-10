// ALL FUNCTIONS IN THIS FOLDER ARE EXPORTED TO app.mjs
// TO RUN THESE FUNCTIONS, RUN app.mjs
import { QueryResult } from 'pg';
import { get_rds_connection, TABLE_NAME } from './rds_config';

interface PackageData {
    package_id: number,
    package_name: string,
    rating: object,
    num_downloads: number,
    created_at: Date,
}

async function add_rds_package_data(name: string, rating: object) {
    const client = await get_rds_connection();

    try {
        const query = 'INSERT INTO package_data(package_name, rating, num_downloads) VALUES($1, $2, $2)'
        const values = [name, rating, 0]
        await client.query(query, values);
      } catch (error) {
        console.error('Error entering data:', error);
      } finally {
        await client.end();
      }
}

async function match_rds_rows(regex: string) {
    const client = await get_rds_connection();

    try {
        const query = `
            SELECT * FROM ${TABLE_NAME}
            WHERE package_name ~ $1;
        `;
        const values = [regex]

        const result: QueryResult<PackageData> = await client.query(query, values);

        console.log('Query result:', result.rows);
    
        return result.rows;

      } catch (error) {
        console.error('Error searching data:', error);
      } finally {
        await client.end();
      }
}

export {
    add_rds_package_data,
    match_rds_rows,
    PackageData,
}
