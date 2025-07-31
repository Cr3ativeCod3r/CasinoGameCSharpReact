# Etap 1: build
FROM mcr.microsoft.com/dotnet/sdk:9.0-preview AS build
WORKDIR /src

# Skopiuj projekt
COPY . .

# Przywróć zależności
RUN dotnet restore

# Publikuj w trybie Release
RUN dotnet publish -c Release -o /app/publish

# Etap 2: runtime
FROM mcr.microsoft.com/dotnet/aspnet:9.0-preview AS runtime
WORKDIR /app

# Skopiuj opublikowaną aplikację
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]