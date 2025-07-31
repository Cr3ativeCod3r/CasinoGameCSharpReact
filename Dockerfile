FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["backend.csproj", "./"]
RUN dotnet restore "./backend.csproj"

COPY . .

# Usuń wszystkie pliki obj i wymuś pełny rebuild
RUN rm -rf obj/ bin/
RUN dotnet publish "./backend.csproj" -c Release -o /app/publish --verbosity normal

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
