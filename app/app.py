import streamlit as st
import pyodbc
import pandas as pd
import plotly.express as px

st.set_page_config(layout="wide")

st.title("SSMS Dashboard 🚀")

try:
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 18 for SQL Server};"
        "SERVER=192.168.1.250,49195;"
        "DATABASE=NEW IRIS;"
        "UID=sa;"
        "PWD=iris0000;"
        "TrustServerCertificate=yes;"
    )

    st.success("✅ Connected to SQL Server")

    query = "SELECT * FROM [NEW IRIS].[dbo].[NEWIRIS_DASHBOARD]"
    df = pd.read_sql(query, conn)

    # 🧠 CLEAN DATA
    df["CATEGORIE"] = df["CATEGORIE"].str.upper().str.strip()
    df = df[df["CATEGORIE"] != "0"]  # remove bad values

    # KPI
    total_ca = df["CA TTC"].sum()
    st.metric("Total CA TTC", f"{total_ca:,.0f} DH")

    # GROUP + SORT
    df_cat = df.groupby("CATEGORIE")["CA TTC"].sum().reset_index()
    df_cat = df_cat.sort_values(by="CA TTC", ascending=False)

    top5 = df_cat.head(5)

    col1, col2 = st.columns(2)

    # PIE
    with col1:
        st.subheader("Top catégories")

        fig = px.pie(
            top5,
            names="CATEGORIE",
            values="CA TTC",
            hole=0.4
        )

        st.plotly_chart(fig, use_container_width=True)

    # BAR
    with col2:
        st.subheader("Top montants")

        fig2 = px.bar(
            top5,
            x="CATEGORIE",
            y="CA TTC"
        )

        st.plotly_chart(fig2, use_container_width=True)

    st.subheader("Données")
    st.dataframe(df)

except Exception as e:
    st.error(f"❌ Error: {e}")