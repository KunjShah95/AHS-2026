from app.core.config import settings


def setup_openapi(app: FastAPI) -> None:
    if settings.OPENAPI_URL:

        @app.get(settings.OPENAPI_URL, include_in_schema=False)
        async def openapi_schema():
            return app.openapi_schema


def setup_swagger_ui(app: FastAPI) -> None:
    @app.get("/docs", include_in_schema=False)
    async def custom_swagger_ui():
        return get_swagger_ui_html(openapi_url="/openapi.json", title="CodeFlow API")

    @app.get("/redoc", include_in_schema=False)
    async def redoc_html():
        return get_redoc_html(openapi_url="/openapi.json", title="CodeFlow API ReDoc")


def get_swagger_ui_html(openapi_url: str, title: str):
    from fastapi.responses import HTMLResponse

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
        <link rel="icon" href="https://fastapi.tiangolo.com/img/favicon.png" />
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
        <script>
            const ui = SwaggerUI({{
                url: '{openapi_url}',
                dom_id: '#swagger-ui',
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIBundle.SwaggerUIStandalonePreset
                ],
                layout: "StandaloneLayout",
                deepLinking: true,
                showRequestDuration: true,
                docExpansion: 'none',
                filter: true
            }});
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


def get_redoc_html(openapi_url: str, title: str):
    from fastapi.responses import HTMLResponse

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{title}</title>
        <link href="https://unpkg.com/redoc@next/bundles/redoc.standalone.js" rel="stylesheet" />
    </head>
    <body>
        <redoc spec-url='{openapi_url}'></redoc>
        <script src="https://unpkg.com/redoc@next/bundles/redoc.standalone.js"></script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)
