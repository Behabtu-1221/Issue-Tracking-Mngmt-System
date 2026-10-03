/**
 * Floor Data Transfer Objects
 */
export class CreateFloorDTO {
  constructor(data) {
    this.BuildingID = Number(data.BuildingID);
    this.FloorNumber = Number(data.FloorNumber);
    this.FloorCode = String(data.FloorCode || `FLR-${data.FloorNumber}`).trim();
    this.FloorName = String(data.FloorName || `Floor ${data.FloorNumber}`).trim();
    this.Description = data.Description ? String(data.Description).trim() : null;
    this.TotalOfficeSpaces = data.TotalOfficeSpaces !== undefined && data.TotalOfficeSpaces !== null && data.TotalOfficeSpaces !== ''
      ? Math.max(0, Number(data.TotalOfficeSpaces))
      : 0;
    this.IsActive = data.IsActive !== undefined ? Number(data.IsActive) : 1;
  }
}

export class UpdateFloorDTO {
  constructor(data) {
    if (data.FloorName !== undefined) this.FloorName = String(data.FloorName).trim();
    if (data.FloorCode !== undefined) this.FloorCode = String(data.FloorCode).trim();
    if (data.FloorNumber !== undefined) this.FloorNumber = Number(data.FloorNumber);
    if (data.Description !== undefined) this.Description = data.Description ? String(data.Description).trim() : null;
    if (data.TotalOfficeSpaces !== undefined && data.TotalOfficeSpaces !== null && data.TotalOfficeSpaces !== '') {
      this.TotalOfficeSpaces = Math.max(0, Number(data.TotalOfficeSpaces));
    }
    if (data.IsActive !== undefined) this.IsActive = Number(data.IsActive);
  }
}
