/**
 * Office Unit Data Transfer Objects
 */
export class CreateOfficeUnitDTO {
  constructor(data) {
    this.FloorID = Number(data.FloorID);
    this.OfficeTypeID = Number(data.OfficeTypeID || 1);
    this.OfficeNumber = String(data.OfficeNumber || '').trim();
    this.OfficeName = String(data.OfficeName || `Office ${data.OfficeNumber}`).trim();
    this.Description = data.Description ? String(data.Description).trim() : null;
    this.SquareMeters = data.SquareMeters ? Number(data.SquareMeters) : 0;
    this.MaxOccupancy = data.MaxOccupancy !== undefined && data.MaxOccupancy !== null && data.MaxOccupancy !== ''
      ? Number(data.MaxOccupancy)
      : null;
    this.MonthlyRentAmount = data.MonthlyRentAmount !== undefined && data.MonthlyRentAmount !== null && data.MonthlyRentAmount !== ''
      ? Number(data.MonthlyRentAmount)
      : null;
    this.AvailabilityStatus = data.AvailabilityStatus || 'VACANT';
    this.IsActive = data.IsActive !== undefined ? Number(data.IsActive) : 1;
  }
}

export class UpdateOfficeUnitDTO {
  constructor(data) {
    if (data.OfficeTypeID !== undefined) this.OfficeTypeID = Number(data.OfficeTypeID);
    if (data.OfficeNumber !== undefined) this.OfficeNumber = String(data.OfficeNumber).trim();
    if (data.OfficeName !== undefined) this.OfficeName = String(data.OfficeName).trim();
    if (data.Description !== undefined) this.Description = data.Description ? String(data.Description).trim() : null;
    if (data.SquareMeters !== undefined) this.SquareMeters = Number(data.SquareMeters);
    if (data.MaxOccupancy !== undefined) {
      this.MaxOccupancy = (data.MaxOccupancy !== null && data.MaxOccupancy !== '') ? Number(data.MaxOccupancy) : null;
    }
    if (data.MonthlyRentAmount !== undefined) {
      this.MonthlyRentAmount = (data.MonthlyRentAmount !== null && data.MonthlyRentAmount !== '') ? Number(data.MonthlyRentAmount) : null;
    }
    if (data.AvailabilityStatus !== undefined) this.AvailabilityStatus = String(data.AvailabilityStatus).trim();
    if (data.IsActive !== undefined) this.IsActive = Number(data.IsActive);
  }
}
