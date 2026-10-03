import db from '../connection.js';

export async function initFeedbackTable() {
  console.log('--- Initializing IssueRequestFeedback Table ---');

  const createTableSql = `
    CREATE TABLE IF NOT EXISTS IssueRequestFeedback (
      FeedbackID BIGINT AUTO_INCREMENT PRIMARY KEY,
      IssueRequestID BIGINT NOT NULL,
      TenantID BIGINT NOT NULL,
      SubmittedByUserID BIGINT NOT NULL,
      Rating INT NOT NULL,
      ResolutionConfirmed TINYINT(1) DEFAULT 1,
      Comments TEXT,
      TimelinessRating INT NULL,
      QualityRating INT NULL,
      IsActive TINYINT(1) DEFAULT 1,
      IsDeleted TINYINT(1) DEFAULT 0,
      CreatedBy BIGINT DEFAULT NULL,
      CreatedDate DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6),
      ModifiedBy BIGINT DEFAULT NULL,
      ModifiedDate DATETIME(6) DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP(6),
      DeletedBy BIGINT DEFAULT NULL,
      DeletedDate DATETIME(6) DEFAULT NULL,
      RowVersion DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
      UNIQUE KEY uq_feedback_issue (IssueRequestID),
      INDEX idx_feedback_tenant (TenantID),
      INDEX idx_feedback_user (SubmittedByUserID),
      CONSTRAINT fk_feedback_issue FOREIGN KEY (IssueRequestID) REFERENCES IssueRequest (IssueRequestID) ON DELETE CASCADE,
      CONSTRAINT fk_feedback_tenant FOREIGN KEY (TenantID) REFERENCES Tenant (TenantID) ON DELETE CASCADE,
      CONSTRAINT fk_feedback_user FOREIGN KEY (SubmittedByUserID) REFERENCES \`User\` (UserID) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;

  await db.query(createTableSql);
  console.log('IssueRequestFeedback table verified or created.');
}

if (process.argv[1]?.includes('init-feedback-table.js')) {
  initFeedbackTable()
    .then(() => {
      console.log('Feedback table initialized successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to initialize feedback table:', err);
      process.exit(1);
    });
}
