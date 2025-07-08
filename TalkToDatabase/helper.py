import json
import os
import pprint

from chromadb import Settings
from dotenv import load_dotenv
import psycopg
import uuid
import chromadb
from pydantic import BaseModel
from google import genai
from google.genai import types


load_dotenv()

"""
1. Embeddings Database: When you Refresh the database schema, it will create a JSON file with the schema of the database. It should also create ChromaDB embeddings for each type. 
2. Query Builder: That generates SQL queries based on user input. ChromDB wil act as Retriever in this.
3. Insights Generator: That generates insights based on the data in the database. It will use the dataframe 
4. Chart And Graph Generator: That generates charts and graphs based on the data in the database. It will use the dataframe.

Possible Improvements:
- ChromaDB is taking a lot of time to generate embeddings. Can we speed it up.
"""

class SQLOutput(BaseModel):
    generated_sql_query: str
    explanation: str = None

def generate_sql_query(user_question:str) -> str:
    """
    Generates a SQL query based on the user's question.
    :param user_question: str: The user's question in natural language.
    :return: str: The generated SQL query.

    """
    # First we will clean the User Question.
    cleaned_question = user_question.replace("'", "").replace('"', '').replace("?","").replace("!","").strip()

    # Then we will use the ChromaDB to retrieve the relevant tables and columns.
    client = chromadb.PersistentClient(path="Embeddings/",settings=Settings(anonymized_telemetry=False))
    table_collection = client.get_collection(name="table_names")
    tables_result = table_collection.query(
        query_texts=[cleaned_question],
        n_results=3
    )
    # print(tables_result)

    # Then we will use the retrieved tables and columns to generate the SQL query.
    column_collection = client.get_collection(name="column_names")
    columns_result = column_collection.query(
        query_texts=[cleaned_question],
        n_results=5
    )
    # print(columns_result)


    """
    **Your Output Must Include:**
    1.  **Generated SQL Query:** The complete Postgres-compatible SQL query.
    2.  **Explanation (Optional but Recommended):** A brief explanation of the query's logic, including why certain clauses or functions were used.
    """
    db_type = "Postgres"

    sql_prompt = f""" You are an expert SQL query generator. Your task is to translate natural language questions into accurate and efficient {db_type}-compatible SQL queries.
    
    You will be provided with:
    1.  **User Question:** {user_question}
    2.  **Tables:** {tables_result}
    3.  **Relevant Column Data :** {columns_result}
    4. ""Database Schema:** dbo
    ---
    
    **Instructions to follow:**
    
    * **Compatibility:** Ensure all generated SQL syntax, functions, and data types are compatible with {db_type}.
    * **Clarity and Readability:** Generate clear, well-formatted SQL queries.
    * **Accuracy:** The query must accurately address the user's question based on the provided information.
    * **Efficiency (where applicable):** Consider common query optimization techniques.
    * **Error Handling/Limitations:** If a query cannot be generated with the provided information, explain why.
    * **Common Operations:** Be prepared to handle `SELECT`, `WHERE`, `JOIN` (INNER, LEFT, RIGHT, FULL), `GROUP BY`, `ORDER BY`, `LIMIT`, `OFFSET`,
    aggregate functions (`COUNT`, `SUM`, `AVG`, `MIN`, `MAX`), subqueries, and common {db_type}-specific functions (e.g., `DATE_TRUNC`, `EXTRACT`, `COALESCE`).
    
    
    
    **Example Input:**
    **User Question:**
    "List all product names and their prices."
    
    **Database Schema:**
    Table: dbo."products"
    Columns:
      - `product_id` (INTEGER, PRIMARY KEY)
      - `product_name` (VARCHAR)
      - `price` (NUMERIC)
      - `stock_quantity` (INTEGER)
    
    Example Output (SQL Query): "SELECT "product_name", "price" FROM dbo."products";"
    
"""

    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    llm_response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=sql_prompt,
        config= types.GenerateContentConfig(
            thinking_config=types.ThinkingConfig(thinking_budget=-1),
            temperature=0.2,
            response_mime_type="application/json",
            response_schema=SQLOutput
        )
    )

    output_response: SQLOutput = llm_response.parsed
    print(output_response)
    return output_response.generated_sql_query

def execute_query(sql_query: str) -> tuple:
    """
    Executes a SQL query against a PostgresSQL database and returns the results.It does not generate the SQL query, it only executes it.
    :param sql_query: str: The SQL query to execute.
    :return: tuple: A tuple containing the headers and rows of the result set.
    """
    try:
        db_url = f"postgresql://{os.environ['POSTGRESQL_USERNAME']}:{os.environ['POSTGRESQL_PASSWORD']}@{os.environ['POSTGRESQL_HOST']}:{os.environ['POSTGRESQL_PORT']}/{os.environ['POSTGRESQL_DATABASE']}"
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cursor:
                cursor.execute(sql_query)
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

    generate_embeddings()

    return "Database schema refreshed successfully."

def generate_embeddings():

    with open("database_schema.json", "r") as file:
        schema = file.read()

    database_schema = json.loads(schema)

    # Storing Table Names in ChromaDB.
    client = chromadb.PersistentClient(path="Embeddings/", settings=Settings(allow_reset=True,anonymized_telemetry=False))
    client.reset() # Empty the database before adding new data.

    collection = client.create_collection(name="table_names")
    print("Storing table names in ChromaDB...")

    collection.add(
        documents=list(database_schema.keys()),
        metadatas=[{"table_name": table_name} for table_name in list(database_schema.keys())],
        ids=[str(uuid.uuid4()) for _ in range(0,len(database_schema.keys()))]
    )
    print("Table names stored in ChromaDB.")

    # Storing Column Names in ChromaDB.
    print("Storing column names in ChromaDB...")
    collection = client.create_collection(name="column_names")
    for table_name, columns in database_schema.items():
        collection.add(
            documents=[column["column_name"] for column in columns],
            metadatas=[{"table_name": table_name, "column_name": column["column_name"], "data_type": column["data_type"]} for column in columns],
            ids=[str(uuid.uuid4()) for _ in range(0, len(columns))]
        )
    print(f"Column stored in ChromaDB.")


def generate_conversation_id() -> str:
    """
    Generates a unique conversation ID.
    """
    return str(uuid.uuid4())
