export class ParentSummaryDto {
  id!: string;
  fullName!: string;
  email!: string | null;
  childrenCount!: number;
}

export class ParentChildSummaryDto {
  id!: string;
  fullName!: string;
}

export class ParentDetailDto {
  id!: string;
  fullName!: string;
  email!: string | null;
  children!: ParentChildSummaryDto[];
}
