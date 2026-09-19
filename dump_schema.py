import asyncio
from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import postgresql
from app.models.base import Base
from app.models.user import User
from app.models.club import Club
from app.models.parent import Parent
from app.models.child import Child
from app.models.sport import Sport
from app.models.course import Course
from app.models.evaluation import PhysicalTest, PsychologicalForm

def dump_sql():
    with open("schema_dump.sql", "w") as f:
        for table in Base.metadata.sorted_tables:
            # Create the table DDL
            f.write(str(CreateTable(table).compile(dialect=postgresql.dialect())).strip() + ";\n\n")

if __name__ == "__main__":
    dump_sql()
    print("Schema dumped to schema_dump.sql")
