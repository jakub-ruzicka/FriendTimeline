# syntax=docker/dockerfile:1

FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /app

# 1) cache dependencies
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN ./mvnw -q -DskipTests dependency:go-offline

# 2) build
COPY src src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Render očekává, že app poslouchá na PORT (defaultně 10000)
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["java","-jar","app.jar"]
