export interface CreateSaleDto {
  weight: number;
  price: number;
  timestamp: number;
}

export interface UpdateSaleDto {
  id: string;
  newData: CreateSaleDto;
}