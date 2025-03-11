from fastapi import FastAPI
from pymongo import MongoClient
import json

app = FastAPI()
client = MongoClient('')

@app.get('/')
def get_all():
    # Build a class to setup a database connection seperately
    database = client['DSTBGDatabase']
    collection = database['DSTBGCards']
    results = collection.find({})

    data = [result for result in results][0]
    data.pop('_id')
    print(data)
    return json.dumps(data)