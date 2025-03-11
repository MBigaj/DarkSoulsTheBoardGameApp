from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
import json

app = FastAPI()
client = MongoClient('')

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
    # Build a class to setup a database connection seperately
    database = client['databasename']
    collection = database['collectionname']
    results = collection.find({})

    data = [result for result in results][0]
    data.pop('_id')
    print(data)
    return data