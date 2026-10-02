// Remove espaços no início e no fim de textos (usado com @Transform)
export const aparar = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;