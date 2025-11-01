--- conventions nommages | syntaxe de l'IUTINFO Villeneuve d'ascq

create table if not exists users (
    uno serial primary key,
    email text unique not null,
    password text not null,
    created_at timestamp default now()
);

create table if not exists projects (
    pno serial primary key,
    uno int not null references users(uno) on delete cascade,
    name text not null,
    description text,
    created_at timestamp default now()
);

create table if not exists files (
    fno serial primary key,
    pno int not null references projects(pno) on delete cascade,
    filename text not null,
    content bytea not null,
    file_type text not null,
    created_at timestamp default now()
);
