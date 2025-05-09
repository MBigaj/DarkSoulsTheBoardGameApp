from pymongo import MongoClient
from dotenv import load_dotenv

import os


class MongoDBSingleton:
    client: MongoClient
    connection = None

    def __init__(self):
        load_dotenv()
        self.client = MongoClient(os.environ.get('DATABASE_CONNECTION_STRING'))

    def get_connection(self):
        if not self.connection:
            self.connection = self.client[os.environ.get('DATABASE_CLIENT')]
        return self.connection
    