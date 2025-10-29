create table if not exists users (
    uno serial primary key,
    email text unique not null,
    password text not null,
    created_at timestamp default now()
);

create table if not exists projects (
    pno serial primary key,
    user_id int not null references users(uno) on delete cascade,
    name text not null,
    description text,
    created_at timestamp default now()
);

create table if not exists file (
    fno serial primary key,
    project_id int not null references projects(pno) on delete cascade,
    filename text not null,
    content bytea not null,
    file_type text not null,
    created_at timestamp default now()
);
