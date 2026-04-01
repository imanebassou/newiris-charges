from django.http import JsonResponse
import pyodbc

def ssms_dashboard(request):
    try:
        conn = pyodbc.connect(
            "DRIVER={ODBC Driver 18 for SQL Server};"
            "SERVER=192.168.1.250,49195;"
            "DATABASE=NEW IRIS;"
            "UID=sa;"
            "PWD=iris0000;"
            "TrustServerCertificate=yes;"
        )

        cursor = conn.cursor()

        # 🔢 TOTAL CA
        cursor.execute("SELECT SUM([CA TTC]) FROM [NEW IRIS].[dbo].[NEWIRIS_DASHBOARD]")
        total_ca = cursor.fetchone()[0] or 0

        # 📊 TOP CATEGORIES
        cursor.execute("""
            SELECT TOP 5 [CATEGORIE], SUM([CA TTC]) as total
            FROM [NEW IRIS].[dbo].[NEWIRIS_DASHBOARD]
            GROUP BY [CATEGORIE]
            ORDER BY total DESC
        """)

        categories = []
        for row in cursor.fetchall():
            categories.append({
                "categorie": row[0] if row[0] else "N/A",
                "total": float(row[1])
            })

        conn.close()

        return JsonResponse({
            "total_ca": float(total_ca),
            "categories": categories
        })

    except Exception as e:
        return JsonResponse({"error": str(e)})