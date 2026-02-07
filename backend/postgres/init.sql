--- conventions nommages | syntaxe de l'IUT de Lille

create extension if not exists pgcrypto;

create table if not exists users (
    uno text primary key default gen_random_uuid()::text,
    email text unique not null,
    password text not null,
    created_at timestamp default now(),
    project_count int default 0,
    constraint chk_project_limit check (project_count <= 5)
);

create table if not exists projects (
    pno text primary key default gen_random_uuid()::text,
    uno text not null references users(uno) on delete cascade,
    name varchar(100) not null,
    description text,
    created_at timestamp default now(),
    total_size bigint default 0,
    constraint chk_project_size check (total_size <= 10 * 1024 * 1024)
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

-- trigger pour gérer le compteur de projets par utilisateur
create or replace function update_project_count()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update users set project_count = project_count + 1 where uno = new.uno;
        return new;
    elsif tg_op = 'DELETE' then
        update users set project_count = project_count - 1 where uno = old.uno;
        return old;
    end if;
    return null;
end;
$$ language plpgsql;

drop trigger if exists trg_project_count on projects;
create trigger trg_project_count
    after insert or delete on projects
    for each row
    execute function update_project_count();

-- trigger pour gérer la taille totale d'un projet
create or replace function update_project_size()
returns trigger as $$
begin
    if tg_op = 'INSERT' then
        update projects set total_size = total_size + octet_length(new.content) where pno = new.pno;
        return new;
    elsif tg_op = 'DELETE' then
        update projects set total_size = total_size - octet_length(old.content) where pno = old.pno;
        return old;
    elsif tg_op = 'UPDATE' then
        update projects set total_size = total_size - octet_length(old.content) + octet_length(new.content) where pno = new.pno;
        return new;
    end if;
    return null;
end;
$$ language plpgsql;

drop trigger if exists trg_project_size on files;
create trigger trg_project_size
    after insert or update or delete on files
    for each row
    execute function update_project_size();
