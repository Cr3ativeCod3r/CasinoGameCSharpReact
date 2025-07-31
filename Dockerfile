FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["backend.csproj", "./"]
RUN dotnet restore "./backend.csproj"

COPY . .

# Usuń WSZYSTKIE katalogi obj i bin (zarówno Debug jak i Release)
RUN find . -name "obj" -type d -exec rm -rf {} + 2>/dev/null || true
RUN find . -name "bin" -type d -exec rm -rf {} + 2>/dev/null || true

# Teraz zrób publish
RUN dotnet publish "./backend.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
