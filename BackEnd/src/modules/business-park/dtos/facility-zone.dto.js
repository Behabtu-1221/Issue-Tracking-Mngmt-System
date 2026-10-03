/**
 * Facility Zone Data Transfer Objects
 */
export class CreateFacilityZoneDTO {
  constructor(data) {
    this.BusinessParkID = Number(data.BusinessParkID);
    this.FacilityZoneCode = String(data.FacilityZoneCode || '').trim();
    this.FacilityZoneName = String(data.FacilityZoneName || '').trim();
    this.ZoneType = data.ZoneType ? String(data.ZoneType).trim() : 'OPERATIONAL';
    this.Description = data.Description ? String(data.Description).trim() : null;
    this.CapacityLimit = data.CapacityLimit !== undefined && data.CapacityLimit !== null && data.CapacityLimit !== ''
      ? Number(data.CapacityLimit)
      : null;
    this.IsActive = data.IsActive !== undefined ? Number(data.IsActive) : 1;
  }
}

export class UpdateFacilityZoneDTO {
  constructor(data) {
    if (data.FacilityZoneName !== undefined) this.FacilityZoneName = String(data.FacilityZoneName).trim();
    if (data.ZoneType !== undefined) this.ZoneType = String(data.ZoneType).trim();
    if (data.Description !== undefined) this.Description = data.Description ? String(data.Description).trim() : null;
    if (data.CapacityLimit !== undefined) {
      this.CapacityLimit = (data.CapacityLimit !== null && data.CapacityLimit !== '') ? Number(data.CapacityLimit) : null;
    }
    if (data.IsActive !== undefined) this.IsActive = Number(data.IsActive);
  }
}
