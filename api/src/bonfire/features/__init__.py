"""Feature slices. Each slice owns one area of the API end to end:

router.py      HTTP only: paths, params, status codes, response models
service.py     the rules; no HTTP and no Mongo details
repository.py  the only code that talks to MongoDB
schemas.py     public request/response models (the API contract)
models.py      internal domain models (may hold fields the API never returns)
"""
