-- CreateEnum
CREATE TYPE "public"."FinalRemark" AS ENUM ('INTERVIEW_PENDING', 'REJECTED', 'FINAL_SELECTION', 'CLIENT_SELECTED', 'BACK_OUT', 'ON_HOLD', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."OpsRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."OpsTaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "public"."OpsTaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "public"."OpsFieldType" AS ENUM ('TEXT', 'NUMBER', 'DATE', 'SELECT');

-- CreateTable
CREATE TABLE "public"."Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."State" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,

    CONSTRAINT "State_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "stateId" TEXT NOT NULL,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Store" (
    "id" TEXT NOT NULL,
    "externalStoreId" TEXT,
    "accountName" TEXT NOT NULL,
    "storeName" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "supervisor" TEXT,
    "poa" TEXT,
    "region" TEXT,
    "vertical" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpenPosition" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "positionCount" INTEGER NOT NULL,
    "openPositionCount" INTEGER NOT NULL,
    "dateOfOpen" TIMESTAMP(3),
    "selectionDate" TIMESTAMP(3),
    "sourceFileName" TEXT,
    "sourceRowNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpenPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Candidate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactNumber" TEXT,
    "recruiter" TEXT,
    "qualification" TEXT,
    "currentOrganization" TEXT,
    "experienceYears" DOUBLE PRECISION,
    "currentSalary" DOUBLE PRECISION,
    "expectedSalary" DOUBLE PRECISION,
    "city" TEXT,
    "state" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Lineup" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "lineupDate" TIMESTAMP(3),
    "clientRemarks" TEXT,
    "finalRemarks" TEXT,
    "finalRemarkTag" "public"."FinalRemark" NOT NULL DEFAULT 'OTHER',
    "feedbackDate" TIMESTAMP(3),
    "tatForFeedback" INTEGER,
    "remarks" TEXT,
    "sourceFileName" TEXT,
    "sourceRowNumber" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lineup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ImportJob" (
    "id" TEXT NOT NULL,
    "sourceFileName" TEXT NOT NULL,
    "sourceStoragePath" TEXT,
    "status" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "rowsRead" INTEGER NOT NULL DEFAULT 0,
    "rowsImported" INTEGER NOT NULL DEFAULT 0,
    "errorsCount" INTEGER NOT NULL DEFAULT 0,
    "errorsJson" TEXT,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Dashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "filtersJson" TEXT NOT NULL,
    "layoutJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DashboardWidget" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "widgetType" TEXT NOT NULL,
    "configJson" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,

    CONSTRAINT "DashboardWidget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsUser" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "designation" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "public"."OpsRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "canCreateTask" BOOLEAN NOT NULL DEFAULT true,
    "canAssignTask" BOOLEAN NOT NULL DEFAULT true,
    "canViewAllTasks" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."OpsTaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "public"."OpsTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "dueAt" TIMESTAMP(3),
    "etaBreachedAt" TIMESTAMP(3),
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskEtaAlert" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "breachedAt" TIMESTAMP(3) NOT NULL,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsTaskEtaAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskMember" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grantedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsTaskMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskFieldDefinition" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fieldType" "public"."OpsFieldType" NOT NULL DEFAULT 'TEXT',
    "optionsJson" TEXT,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpsTaskFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskFieldValue" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fieldDefinitionId" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "OpsTaskFieldValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskNote" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsTaskNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OpsTaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpsTaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Country_code_key" ON "public"."Country"("code");

-- CreateIndex
CREATE INDEX "State_countryId_idx" ON "public"."State"("countryId");

-- CreateIndex
CREATE UNIQUE INDEX "State_countryId_name_key" ON "public"."State"("countryId", "name");

-- CreateIndex
CREATE INDEX "City_stateId_idx" ON "public"."City"("stateId");

-- CreateIndex
CREATE UNIQUE INDEX "City_stateId_name_key" ON "public"."City"("stateId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Store_externalStoreId_key" ON "public"."Store"("externalStoreId");

-- CreateIndex
CREATE INDEX "Store_storeName_city_state_idx" ON "public"."Store"("storeName", "city", "state");

-- CreateIndex
CREATE INDEX "Store_accountName_storeName_idx" ON "public"."Store"("accountName", "storeName");

-- CreateIndex
CREATE INDEX "Store_state_city_idx" ON "public"."Store"("state", "city");

-- CreateIndex
CREATE INDEX "OpenPosition_storeId_idx" ON "public"."OpenPosition"("storeId");

-- CreateIndex
CREATE INDEX "OpenPosition_designation_idx" ON "public"."OpenPosition"("designation");

-- CreateIndex
CREATE INDEX "OpenPosition_createdAt_idx" ON "public"."OpenPosition"("createdAt");

-- CreateIndex
CREATE INDEX "OpenPosition_dateOfOpen_idx" ON "public"."OpenPosition"("dateOfOpen");

-- CreateIndex
CREATE INDEX "Candidate_name_idx" ON "public"."Candidate"("name");

-- CreateIndex
CREATE INDEX "Candidate_contactNumber_idx" ON "public"."Candidate"("contactNumber");

-- CreateIndex
CREATE INDEX "Lineup_storeId_idx" ON "public"."Lineup"("storeId");

-- CreateIndex
CREATE INDEX "Lineup_candidateId_idx" ON "public"."Lineup"("candidateId");

-- CreateIndex
CREATE INDEX "Lineup_finalRemarkTag_idx" ON "public"."Lineup"("finalRemarkTag");

-- CreateIndex
CREATE INDEX "Lineup_createdAt_idx" ON "public"."Lineup"("createdAt");

-- CreateIndex
CREATE INDEX "DashboardWidget_dashboardId_orderIndex_idx" ON "public"."DashboardWidget"("dashboardId", "orderIndex");

-- CreateIndex
CREATE UNIQUE INDEX "OpsUser_email_key" ON "public"."OpsUser"("email");

-- CreateIndex
CREATE INDEX "OpsUser_role_isActive_idx" ON "public"."OpsUser"("role", "isActive");

-- CreateIndex
CREATE INDEX "OpsTask_assigneeId_idx" ON "public"."OpsTask"("assigneeId");

-- CreateIndex
CREATE INDEX "OpsTask_createdById_idx" ON "public"."OpsTask"("createdById");

-- CreateIndex
CREATE INDEX "OpsTask_status_idx" ON "public"."OpsTask"("status");

-- CreateIndex
CREATE INDEX "OpsTask_dueAt_idx" ON "public"."OpsTask"("dueAt");

-- CreateIndex
CREATE INDEX "OpsTask_etaBreachedAt_idx" ON "public"."OpsTask"("etaBreachedAt");

-- CreateIndex
CREATE INDEX "OpsTask_createdAt_idx" ON "public"."OpsTask"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "OpsTaskEtaAlert_taskId_key" ON "public"."OpsTaskEtaAlert"("taskId");

-- CreateIndex
CREATE INDEX "OpsTaskEtaAlert_acknowledgedAt_idx" ON "public"."OpsTaskEtaAlert"("acknowledgedAt");

-- CreateIndex
CREATE INDEX "OpsTaskEtaAlert_breachedAt_idx" ON "public"."OpsTaskEtaAlert"("breachedAt");

-- CreateIndex
CREATE INDEX "OpsTaskMember_userId_idx" ON "public"."OpsTaskMember"("userId");

-- CreateIndex
CREATE INDEX "OpsTaskMember_grantedById_idx" ON "public"."OpsTaskMember"("grantedById");

-- CreateIndex
CREATE UNIQUE INDEX "OpsTaskMember_taskId_userId_key" ON "public"."OpsTaskMember"("taskId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "OpsTaskFieldDefinition_slug_key" ON "public"."OpsTaskFieldDefinition"("slug");

-- CreateIndex
CREATE INDEX "OpsTaskFieldDefinition_isActive_orderIndex_idx" ON "public"."OpsTaskFieldDefinition"("isActive", "orderIndex");

-- CreateIndex
CREATE INDEX "OpsTaskFieldValue_fieldDefinitionId_idx" ON "public"."OpsTaskFieldValue"("fieldDefinitionId");

-- CreateIndex
CREATE UNIQUE INDEX "OpsTaskFieldValue_taskId_fieldDefinitionId_key" ON "public"."OpsTaskFieldValue"("taskId", "fieldDefinitionId");

-- CreateIndex
CREATE INDEX "OpsTaskNote_taskId_createdAt_idx" ON "public"."OpsTaskNote"("taskId", "createdAt");

-- CreateIndex
CREATE INDEX "OpsTaskActivity_taskId_createdAt_idx" ON "public"."OpsTaskActivity"("taskId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."State" ADD CONSTRAINT "State_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "public"."Country"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."City" ADD CONSTRAINT "City_stateId_fkey" FOREIGN KEY ("stateId") REFERENCES "public"."State"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpenPosition" ADD CONSTRAINT "OpenPosition_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lineup" ADD CONSTRAINT "Lineup_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Lineup" ADD CONSTRAINT "Lineup_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "public"."Candidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DashboardWidget" ADD CONSTRAINT "DashboardWidget_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "public"."Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTask" ADD CONSTRAINT "OpsTask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "public"."OpsUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTask" ADD CONSTRAINT "OpsTask_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."OpsUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskEtaAlert" ADD CONSTRAINT "OpsTaskEtaAlert_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."OpsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskEtaAlert" ADD CONSTRAINT "OpsTaskEtaAlert_acknowledgedById_fkey" FOREIGN KEY ("acknowledgedById") REFERENCES "public"."OpsUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskMember" ADD CONSTRAINT "OpsTaskMember_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."OpsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskMember" ADD CONSTRAINT "OpsTaskMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."OpsUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskMember" ADD CONSTRAINT "OpsTaskMember_grantedById_fkey" FOREIGN KEY ("grantedById") REFERENCES "public"."OpsUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskFieldValue" ADD CONSTRAINT "OpsTaskFieldValue_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."OpsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskFieldValue" ADD CONSTRAINT "OpsTaskFieldValue_fieldDefinitionId_fkey" FOREIGN KEY ("fieldDefinitionId") REFERENCES "public"."OpsTaskFieldDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskNote" ADD CONSTRAINT "OpsTaskNote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."OpsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskNote" ADD CONSTRAINT "OpsTaskNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."OpsUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskActivity" ADD CONSTRAINT "OpsTaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "public"."OpsTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."OpsTaskActivity" ADD CONSTRAINT "OpsTaskActivity_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."OpsUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
