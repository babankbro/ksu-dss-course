# References — Week 03 Data Management and Data Warehouse

## Dimensional Modeling

1. IBM Research. *Data Warehouse Characteristics and Integration*.  
   https://dominoweb.draco.res.ibm.com/reports/rc23184.pdf
2. Kimball Group. *Kimball Dimensional Modeling Techniques*.  
   https://www.kimballgroup.com/wp-content/uploads/2013/08/2013.09-Kimball-Dimensional-Modeling-Techniques11.pdf
3. Microsoft Learn. *Dimensional modeling in Microsoft Fabric Warehouse*.  
   https://learn.microsoft.com/en-us/fabric/data-warehouse/dimensional-modeling-overview
4. Microsoft Learn. *Understand star schema and the importance for Power BI*.  
   https://learn.microsoft.com/en-ie/power-bi/guidance/star-schema
5. Microsoft Learn. *Wide World Importers DW database catalog*.  
   https://learn.microsoft.com/en-us/sql/samples/wide-world-importers-dw-database-catalog

## Modern Data Architecture

6. Microsoft Learn. *Exploring the Modern Data Warehouse*.  
   https://learn.microsoft.com/en-us/data-engineering/playbook/solutions/modern-data-warehouse/
7. Databricks Documentation. *What is the medallion lakehouse architecture?*  
   https://docs.databricks.com/gcp/en/lakehouse/medallion

## Lab Tools

8. DuckDB Documentation. *Importing Data*.  
   https://duckdb.org/docs/current/data/overview
9. DuckDB Documentation. *COPY Statement*.  
   https://duckdb.org/docs/lts/sql/statements/copy
10. DuckDB Documentation. *Partitioned Writes*.  
   https://duckdb.org/docs/stable/data/partitioning/partitioned_writes

## หมายเหตุการใช้

- นิยาม grain, fact/dimension และ SCD อ้างอิง Kimball และ Microsoft
- Star Schema และ historical change ใช้คำอธิบายจาก Microsoft Learn
- ETL/ELT และ Modern Data Warehouse อ้างอิง Microsoft
- Bronze/Silver/Gold ใช้กรอบ medallion จาก Databricks
- ตัวอย่าง SQL ใน Lab ใช้รูปแบบที่สอดคล้องกับ DuckDB documentation
