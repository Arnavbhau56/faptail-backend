export class CreateOrderDto {
  customer_name: string
  customer_phone: string
  customer_email?: string
  notes?: string
  items: {
    product_id: string
    quantity: number
  }[]
}