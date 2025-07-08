import os
import pprint

from dotenv import load_dotenv
import psycopg
import uuid
load_dotenv()

"""
1. Embeddings Database: When you Refresh the database schema, it will create a JSON file with the schema of the database. It should also create ChromaDB embeddings for each type. 
2. Query Builder: That generates SQL queries based on user input. ChromDB wil act as Retriever in this.
3. Insights Generator: That generates insights based on the data in the database. It will use the dataframe 
4. Chart And Graph Generator: That generates charts and graphs based on the data in the database. It will use the dataframe.

"""



def execute_query(query: str, params: tuple = ()) -> tuple:
    """
    Executes a SQL query against a PostgresSQL database and returns the results.
    :param query: str: The SQL query to execute.
    :param params: tuple: The parameters to pass to the query.
    :return: tuple: A tuple containing the headers and rows of the result set.
    """
    try:
        db_url = f"postgresql://{os.environ['POSTGRESQL_USERNAME']}:{os.environ['POSTGRESQL_PASSWORD']}@{os.environ['POSTGRESQL_HOST']}:{os.environ['POSTGRESQL_PORT']}/{os.environ['POSTGRESQL_DATABASE']}"
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute(query, params)
                if cursor.description:
                    headers = [desc[0] for desc in cursor.description]
                    rows = cursor.fetchall()
                    return headers, rows
                else:
                    return [], []
    except Exception as e:
        print(f"Error executing query: {e}")
        return [] , []

def get_all_tables() -> list:
    """
    Retrieves all table names from the PostgreSQL database.
    :return: list: A list of table names.
    """
    query = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'dbo';"
    headers, rows = execute_query(query)
    return [row[0] for row in rows] if rows else []

def get_all_columns(table_name: str) -> list:
        """
        Retrieves all column names and their data types for a given table in the PostgreSQL database.
        :param table_name: str: The name of the table.
        :return: list: A list of tuples (column_name, data_type).
        """
        query = "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = %s;"
        headers, rows = execute_query(query, (table_name,))
        return [(row[0], row[1]) for row in rows] if rows else []

def refresh_db_schema() -> str:
    """
    Refreshes the database schema by retrieving all tables and their columns.
    :return: str: A message indicating the schema has been refreshed.
    """
    # Delete the existing schema file if it exists.
    if os.path.exists("database_schema.json"):
        os.remove("database_schema.json")

    tables = get_all_tables()
    schema = {}
    for table in tables:
        for single_col, data_type in get_all_columns(table):
            if table not in schema:
                schema[table] = []
            schema[table].append({"column_name": single_col, "data_type": data_type, "column_description": ""})

    # Write the schema to a JSON file.
    schema_file_path = "database_schema.json"
    with open(schema_file_path, 'w') as schema_file:
        import json
        json.dump(schema, schema_file, indent=4)

    return "Database schema refreshed successfully."

def generate_conversation_id() -> str:
    """
    Generates a unique conversation ID.
    """
    return str(uuid.uuid4())
