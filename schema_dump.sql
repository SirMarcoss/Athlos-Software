CREATE TABLE sports (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	storytelling_description VARCHAR(1000), 
	fun_facts VARCHAR(500), 
	benefits_summary VARCHAR(500), 
	introductory_video_url VARCHAR(255), 
	PRIMARY KEY (id), 
	UNIQUE (name)
);

CREATE TABLE users (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	email VARCHAR(255) NOT NULL, 
	password_hash VARCHAR(255) NOT NULL, 
	first_name VARCHAR(100), 
	last_name VARCHAR(100), 
	role user_role_enum DEFAULT 'parent' NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	deleted_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE TABLE clubs (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	user_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	address JSONB, 
	phone_number VARCHAR(20) NOT NULL, 
	email_contact VARCHAR(255) NOT NULL, 
	logo_url VARCHAR(255), 
	latitude FLOAT, 
	longitude FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE parents (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	user_id UUID NOT NULL, 
	first_name VARCHAR(100) NOT NULL, 
	last_name VARCHAR(100) NOT NULL, 
	phone_number VARCHAR(20) NOT NULL, 
	fiscal_code VARCHAR(16) NOT NULL, 
	info VARCHAR(255), 
	referral_code VARCHAR(50), 
	referred_by_id UUID, 
	address JSONB, 
	latitude FLOAT, 
	longitude FLOAT, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE, 
	UNIQUE (referral_code), 
	FOREIGN KEY(referred_by_id) REFERENCES parents (id) ON DELETE SET NULL
);

CREATE TABLE children (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	parent_id UUID NOT NULL, 
	first_name VARCHAR(255) NOT NULL, 
	last_name VARCHAR(255) NOT NULL, 
	date_of_birth DATE NOT NULL, 
	gender VARCHAR(10) NOT NULL, 
	sport VARCHAR(255) NOT NULL, 
	skills VARCHAR[] NOT NULL, 
	fiscal_code VARCHAR(16) NOT NULL, 
	medical_notes VARCHAR(255), 
	info VARCHAR(255), 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_id) REFERENCES parents (id) ON DELETE CASCADE
);

CREATE TABLE courses (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	clubs_id UUID NOT NULL, 
	sport_id UUID NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	min_age INTEGER NOT NULL, 
	max_age INTEGER NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(clubs_id) REFERENCES clubs (id) ON DELETE CASCADE, 
	FOREIGN KEY(sport_id) REFERENCES sports (id) ON DELETE RESTRICT
);

CREATE TABLE physical_tests (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	course_id UUID NOT NULL, 
	child_id UUID NOT NULL, 
	test_type VARCHAR(100) NOT NULL, 
	score_value FLOAT NOT NULL, 
	trimester_id VARCHAR(50) NOT NULL, 
	date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(course_id) REFERENCES courses (id) ON DELETE CASCADE, 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE CASCADE
);

CREATE TABLE psychological_forms (
	id UUID DEFAULT gen_random_uuid() NOT NULL, 
	course_id UUID NOT NULL, 
	child_id UUID NOT NULL, 
	trimester_id VARCHAR(50) NOT NULL, 
	creativity_score INTEGER NOT NULL, 
	teamwork_score INTEGER NOT NULL, 
	stress_management_score INTEGER NOT NULL, 
	coach_notes VARCHAR(255), 
	ai_recommended_sport TEXT, 
	date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	CONSTRAINT chk_creativity_valido CHECK (creativity_score >= 0 AND creativity_score <= 10), 
	CONSTRAINT chk_teamwork_valido CHECK (teamwork_score >= 0 AND teamwork_score <= 10), 
	CONSTRAINT chk_stress_valido CHECK (stress_management_score >= 0 AND stress_management_score <= 10), 
	FOREIGN KEY(course_id) REFERENCES courses (id) ON DELETE CASCADE, 
	FOREIGN KEY(child_id) REFERENCES children (id) ON DELETE CASCADE
);

