"""Card catalog (BE-04, BE-05).

To add, following features/__init__.py:
    models.py      Pydantic discriminated union on `type` (Treasure, Enemy, Boss, ...)
    repository.py  keyset-paged reads from the `cards` collection
    service.py     catalog version, cursor rules
    schemas.py     CardPage {items, nextCursor, total, version}
    router.py      GET /cards, GET /cards/{id}
"""
