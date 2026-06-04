# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["DotNet/OnboardingService/OnboardingService.csproj", "DotNet/OnboardingService/"]
RUN dotnet restore "DotNet/OnboardingService/OnboardingService.csproj"

COPY . .
WORKDIR "/src/DotNet/OnboardingService"
RUN dotnet build "OnboardingService.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "OnboardingService.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5100
ENV ASPNETCORE_HTTP_PORTS=5100

# Install curl for Docker health checks (not in the slim aspnet base image)
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "OnboardingService.dll"]
