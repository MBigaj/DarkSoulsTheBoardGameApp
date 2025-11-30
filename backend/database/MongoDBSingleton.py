from pymongo import MongoClient
from dotenv import load_dotenv

import os


class MongoDBSingleton:
    _client: MongoClient
    _connection = None

    def __init__(self):
        load_dotenv()
        self._client = MongoClient(os.environ.get('DATABASE_CONNECTION_STRING'))

    def get_connection(self):
        if not self._connection:
            self._connection = self._client[os.environ.get('DATABASE_CLIENT')]
        return self._connection
    