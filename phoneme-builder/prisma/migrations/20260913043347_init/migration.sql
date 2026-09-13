-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('WORDLE', 'WORD_SEARCH');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ThemeMode" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateTable
CREATE TABLE "WordList" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WordList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Word" (
    "id" SERIAL NOT NULL,
    "englishWord" TEXT NOT NULL,
    "hint" TEXT,
    "wordListId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Word_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Phoneme" (
    "id" SERIAL NOT NULL,
    "symbol" TEXT NOT NULL,
    "englishLabel" TEXT NOT NULL,
    "example" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Phoneme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WordPhoneme" (
    "id" SERIAL NOT NULL,
    "wordId" INTEGER NOT NULL,
    "phonemeId" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,

    CONSTRAINT "WordPhoneme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "hintsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "showEnglishAnswer" BOOLEAN NOT NULL DEFAULT true,
    "maxAttempts" INTEGER,
    "gridSize" INTEGER,
    "wordListId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityStyle" (
    "id" SERIAL NOT NULL,
    "activityId" INTEGER NOT NULL,
    "themeMode" "ThemeMode" NOT NULL DEFAULT 'LIGHT',
    "accentColor" TEXT DEFAULT '#2563eb',
    "backgroundColor" TEXT DEFAULT '#f8fafc',
    "textColor" TEXT DEFAULT '#0f172a',
    "fontScale" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "highContrast" BOOLEAN NOT NULL DEFAULT false,
    "reducedMotion" BOOLEAN NOT NULL DEFAULT false,
    "enhancedFocus" BOOLEAN NOT NULL DEFAULT true,
    "largeControls" BOOLEAN NOT NULL DEFAULT false,
    "customCss" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivityStyle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Word_wordListId_idx" ON "Word"("wordListId");

-- CreateIndex
CREATE UNIQUE INDEX "Phoneme_symbol_key" ON "Phoneme"("symbol");

-- CreateIndex
CREATE INDEX "WordPhoneme_phonemeId_idx" ON "WordPhoneme"("phonemeId");

-- CreateIndex
CREATE UNIQUE INDEX "WordPhoneme_wordId_position_key" ON "WordPhoneme"("wordId", "position");

-- CreateIndex
CREATE INDEX "Activity_wordListId_idx" ON "Activity"("wordListId");

-- CreateIndex
CREATE UNIQUE INDEX "ActivityStyle_activityId_key" ON "ActivityStyle"("activityId");

-- AddForeignKey
ALTER TABLE "Word" ADD CONSTRAINT "Word_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPhoneme" ADD CONSTRAINT "WordPhoneme_wordId_fkey" FOREIGN KEY ("wordId") REFERENCES "Word"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WordPhoneme" ADD CONSTRAINT "WordPhoneme_phonemeId_fkey" FOREIGN KEY ("phonemeId") REFERENCES "Phoneme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_wordListId_fkey" FOREIGN KEY ("wordListId") REFERENCES "WordList"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityStyle" ADD CONSTRAINT "ActivityStyle_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
