from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import newrelic.agent

from database.MongoDBSingleton import MongoDBSingleton

newrelic.agent.initialize('newrelic.ini')

app = FastAPI()

ORIGINS = [
    'http://localhost:3000',
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get('/')
def get_all():
    mongo_db_singleton = MongoDBSingleton()
    connection = mongo_db_singleton.get_connection()

    collection = connection[os.environ.get('DATABASE_COLLECTION')]
    results = collection.find({})

    data = [result for result in results]
    
    for element in data:
        element.pop('_id')

    return data