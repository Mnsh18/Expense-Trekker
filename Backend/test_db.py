from database import Base, engine
import models


print("Tables registered with SQLAlchemy:")
print(Base.metadata.tables.keys())

print("Creating tables...")

Base.metadata.create_all(bind=engine)

print("Table creation command completed.")

with engine.connect() as connection:
    result = connection.exec_driver_sql("SHOW TABLES")

    print("Tables currently in MySQL:")

    for row in result:
        print(row[0])