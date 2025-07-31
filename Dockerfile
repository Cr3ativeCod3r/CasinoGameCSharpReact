FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Kopiuj tylko pliki projektu najpierw
COPY ["backend.csproj", "./"]
RUN dotnet restore "./backend.csproj"

# Następnie kopiuj kod źródłowy (bez obj/bin)
COPY . .

RUN dotnet publish "./backend.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "backend.dll"]
