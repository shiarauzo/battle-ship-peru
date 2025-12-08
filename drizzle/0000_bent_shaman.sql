CREATE TABLE "battles" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_a" text NOT NULL,
	"model_b" text NOT NULL,
	"accuracy_a" integer NOT NULL,
	"accuracy_b" integer NOT NULL,
	"hits_a" integer NOT NULL,
	"hits_b" integer NOT NULL,
	"misses_a" integer NOT NULL,
	"misses_b" integer NOT NULL,
	"winner" text NOT NULL
);
