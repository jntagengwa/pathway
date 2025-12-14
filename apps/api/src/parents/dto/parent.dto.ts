export interface ParentChildSummaryDto {
  id: string;
  fullName: string;
}

export interface ParentSummaryDto {
  id: string;
  fullName: string;
  email: string | null;
  phone?: string | null;
  isPrimaryContact?: boolean | null;
  childrenCount: number;
}

export interface ParentDetailDto extends ParentSummaryDto {
  children: ParentChildSummaryDto[];
}
