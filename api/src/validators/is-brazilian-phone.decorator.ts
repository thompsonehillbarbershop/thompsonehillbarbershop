import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator'

export function IsBrazilianPhoneE164(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isBrazilianPhoneE164',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, _args: ValidationArguments) {
          if (typeof value !== 'string') return false
          const regex = /^\+55\d{10,11}$/
          return regex.test(value)
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser um telefone brasileiro válido no formato E.164 (ex: +5511912345678)`
        },
      },
    })
  }
}
