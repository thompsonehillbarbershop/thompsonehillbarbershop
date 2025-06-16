import { QueryClient, } from "@tanstack/react-query"

export const queryClient = new QueryClient()

export const queries = {
  admin: {
    users: "admin_users",
    services: "admin_services",
    products: "admin_products",
    customers: "admin_customers",
    appointments: "admin_appointments",
    partnerships: "admin_partnerships",
    apiKeys: "admin_api_keys",
    daySummary: "admin_day_summary",
    settings: "admin_settings",
  },
  totem: {
    attendants: "totem_attendants",
    customer: "totem_customer",
    services: "totem_services",
  },
  attendant: {
    appointments: "attendant_appointments",
    appointment: "attendant_appointment",
    services: "attendant_services",
    products: "attendant_products",
  },
}