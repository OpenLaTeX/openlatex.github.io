--- conventions nommages | syntaxe de l'IUTINFO Villeneuve d'ascq

create extension if not exists pgcrypto;

create table if not exists users (
    uno text primary key default gen_random_uuid()::text,
    email text unique not null,
    password text not null,
    created_at timestamp default now()
);

create table if not exists projects (
    pno text primary key default gen_random_uuid()::text,
    uno text not null references users(uno) on delete cascade,
    name text not null,
    description text,
    created_at timestamp default now()
);

create table if not exists files (
    fno text primary key default gen_random_uuid()::text,
    pno text not null references projects(pno) on delete cascade,
    filename text not null,
    content bytea not null,
    file_type text not null,
    created_at timestamp default now()
);

create index if not exists idx_projects_uno on projects(uno);
create index if not exists idx_files_pno on files(pno);
