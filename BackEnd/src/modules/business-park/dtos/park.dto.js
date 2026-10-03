/**
 * Business Park Data Transfer Objects
 */
export class CreateBusinessParkDTO {
  constructor(data) {
    this.BusinessParkCode = String(data.BusinessParkCode || '').trim();
    this.BusinessParkName = String(data.BusinessParkName || '').trim();
    this.ShortName = data.ShortName ? String(data.ShortName).trim() : null;
    this.Description = data.Description ? String(data.Description).trim() : null;
    this.RegistrationNumber = data.RegistrationNumber ? String(data.RegistrationNumber).trim() : null;
    this.TaxIdentificationNo = data.TaxIdentificationNo ? String(data.TaxIdentificationNo).trim() : null;
    this.Email = data.Email ? String(data.Email).trim() : null;
    this.PhoneNumber = data.PhoneNumber ? String(data.PhoneNumber).trim() : null;
    this.MobileNumber = data.MobileNumber ? String(data.MobileNumber).trim() : null;
    this.Website = data.Website ? String(data.Website).trim() : null;
    this.Country = data.Country ? String(data.Country).trim() : 'Ethiopia';
    this.Region = data.Region ? String(data.Region).trim() : null;
    this.City = data.City ? String(data.City).trim() : 'Addis Ababa';
    this.SubCity = data.SubCity ? String(data.SubCity).trim() : null;
    this.Woreda = data.Woreda ? String(data.Woreda).trim() : null;
    this.PostalCode = data.PostalCode ? String(data.PostalCode).trim() : null;
    this.AddressLine1 = data.AddressLine1 ? String(data.AddressLine1).trim() : null;
    this.AddressLine2 = data.AddressLine2 ? String(data.AddressLine2).trim() : null;
    this.Latitude = data.Latitude !== undefined && data.Latitude !== null && data.Latitude !== '' ? Number(data.Latitude) : null;
    this.Longitude = data.Longitude !== undefined && data.Longitude !== null && data.Longitude !== '' ? Number(data.Longitude) : null;
    this.TimeZone = data.TimeZone || 'Africa/Addis_Ababa';
    this.CurrencyCode = data.CurrencyCode || 'ETB';
    this.LanguageCode = data.LanguageCode || 'en';
    this.LogoPath = data.LogoPath ? String(data.LogoPath).trim() : null;
    this.TotalAreaSquareMeter = data.TotalAreaSquareMeter ? Number(data.TotalAreaSquareMeter) : 0;
    this.IsOperational = data.IsOperational !== undefined ? Number(data.IsOperational) : 1;
    this.IsActive = data.IsActive !== undefined ? Number(data.IsActive) : 1;
  }
}

export class UpdateBusinessParkDTO {
  constructor(data) {
    if (data.BusinessParkName !== undefined) this.BusinessParkName = String(data.BusinessParkName).trim();
    if (data.ShortName !== undefined) this.ShortName = data.ShortName ? String(data.ShortName).trim() : null;
    if (data.Description !== undefined) this.Description = data.Description ? String(data.Description).trim() : null;
    if (data.RegistrationNumber !== undefined) this.RegistrationNumber = data.RegistrationNumber ? String(data.RegistrationNumber).trim() : null;
    if (data.TaxIdentificationNo !== undefined) this.TaxIdentificationNo = data.TaxIdentificationNo ? String(data.TaxIdentificationNo).trim() : null;
    if (data.Email !== undefined) this.Email = data.Email ? String(data.Email).trim() : null;
    if (data.PhoneNumber !== undefined) this.PhoneNumber = data.PhoneNumber ? String(data.PhoneNumber).trim() : null;
    if (data.MobileNumber !== undefined) this.MobileNumber = data.MobileNumber ? String(data.MobileNumber).trim() : null;
    if (data.Website !== undefined) this.Website = data.Website ? String(data.Website).trim() : null;
    if (data.Country !== undefined) this.Country = String(data.Country).trim();
    if (data.Region !== undefined) this.Region = data.Region ? String(data.Region).trim() : null;
    if (data.City !== undefined) this.City = String(data.City).trim();
    if (data.SubCity !== undefined) this.SubCity = data.SubCity ? String(data.SubCity).trim() : null;
    if (data.Woreda !== undefined) this.Woreda = data.Woreda ? String(data.Woreda).trim() : null;
    if (data.PostalCode !== undefined) this.PostalCode = data.PostalCode ? String(data.PostalCode).trim() : null;
    if (data.AddressLine1 !== undefined) this.AddressLine1 = data.AddressLine1 ? String(data.AddressLine1).trim() : null;
    if (data.AddressLine2 !== undefined) this.AddressLine2 = data.AddressLine2 ? String(data.AddressLine2).trim() : null;
    if (data.Latitude !== undefined) this.Latitude = (data.Latitude !== null && data.Latitude !== '') ? Number(data.Latitude) : null;
    if (data.Longitude !== undefined) this.Longitude = (data.Longitude !== null && data.Longitude !== '') ? Number(data.Longitude) : null;
    if (data.TimeZone !== undefined) this.TimeZone = String(data.TimeZone).trim();
    if (data.CurrencyCode !== undefined) this.CurrencyCode = String(data.CurrencyCode).trim();
    if (data.LanguageCode !== undefined) this.LanguageCode = String(data.LanguageCode).trim();
    if (data.LogoPath !== undefined) this.LogoPath = data.LogoPath ? String(data.LogoPath).trim() : null;
    if (data.TotalAreaSquareMeter !== undefined) this.TotalAreaSquareMeter = Number(data.TotalAreaSquareMeter);
    if (data.IsOperational !== undefined) this.IsOperational = Number(data.IsOperational);
    if (data.IsActive !== undefined) this.IsActive = Number(data.IsActive);
  }
}
