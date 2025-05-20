import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ValidationPipe } from "@nestjs/common"
import { useContainer } from "class-validator"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  app.setGlobalPrefix('v1')

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )

  useContainer(app.select(AppModule), { fallbackOnErrors: true })

  //Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Example API')
    .setDescription('The example API description')
    .setVersion('1.0')
    .setContact('Thiago Elias', 'https://github.com/thiagoelias99', 'thiagoelias99@gmail.com')
    .setLicense('MIT', 'https://www.mit.edu/~amini/LICENSE.md')
    .addBearerAuth()
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('v1/docs', app, document)

  // Monitor de memoria
  setInterval(() => {
    const mem = process.memoryUsage()
    console.log(`[MEMORY] Heap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB / ${(mem.heapTotal / 1024 / 1024).toFixed(2)} MB | RSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB`)
  }, 5000)

  await app.listen(process.env.PORT ?? 3000)
  console.log(`Application is running on: ${await app.getUrl()}`)
  console.log(`Swagger is running on: ${await app.getUrl()}/v1/docs`)
}
bootstrap()
