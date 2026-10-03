/**
 * Building Data Transfer Objects
 */
export class CreateBuildingDTO {
  constructor(data) {
    this.BusinessParkID = Number(data.BusinessParkID);
    this.FacilityZoneID = Number(data.FacilityZoneID);
    this.BuildingCode = String(data.BuildingCode || '').trim();
    this.BuildingName = String(data.BuildingName || '').trim();
    this.ShortName = data.ShortName ? String(data.ShortName).trim() : null;
    this.Description = data.Description ? String(data.Description).trim() : null;
    this.TotalFloors = data.TotalFloors !== undefined && data.TotalFloors !== null && data.TotalFloors !== ''
      ? Math.max(1, Number(data.TotalFloors))
      : 1;
    this.TotalAreaSquareMeter = data.TotalAreaSquareMeter !== undefined && data.TotalAreaSquareMeter !== null && data.TotalAreaSquareMeter !== ''
      ? Number(data.TotalAreaSquareMeter)
      : 0;
    this.Latitude = data.Latitude !== undefined && data.Latitude !== null && data.Latitude !== ''
      ? Number(data.Latitude)
      : null;
    this.Longitude = data.Longitude !== undefined && data.Longitude !== null && data.Longitude !== ''
      ? Number(data.Longitude)
      : null;
    this.IsActive = data.IsActive !== undefined ? Number(data.IsActive) : 1;
  }
}

export class UpdateBuildingDTO {
  constructor(data) {
    if (data.FacilityZoneID !== undefined && data.FacilityZoneID !== null && data.FacilityZoneID !== '') {
      this.FacilityZoneID = Number(data.FacilityZoneID);
    }
    if (data.BuildingName !== undefined) this.BuildingName = String(data.BuildingName).trim();
    if (data.ShortName !== undefined) this.ShortName = data.ShortName ? String(data.ShortName).trim() : null;
    if (data.Description !== undefined) this.Description = data.Description ? String(data.Description).trim() : null;
    if (data.TotalFloors !== undefined && data.TotalFloors !== null && data.TotalFloors !== '') {
      this.TotalFloors = Math.max(1, Number(data.TotalFloors));
    }
    if (data.TotalAreaSquareMeter !== undefined && data.TotalAreaSquareMeter !== null && data.TotalAreaSquareMeter !== '') {
      this.TotalAreaSquareMeter = Number(data.TotalAreaSquareMeter);
    }
    if (data.Latitude !== undefined) {
      this.Latitude = (data.Latitude !== null && data.Latitude !== '') ? Number(data.Latitude) : null;
    }
    if (data.Longitude !== undefined) {
      this.Longitude = (data.Longitude !== null && data.Longitude !== '') ? Number(data.Longitude) : null;
    }
    if (data.IsActive !== undefined) this.IsActive = Number(data.IsActive);
  }
}
