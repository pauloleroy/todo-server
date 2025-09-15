-- ==========================
-- TABELAS PRINCIPAIS
-- ==========================

-- Empresas
CREATE TABLE empresas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pessoas
CREATE TABLE pessoas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tarefas
CREATE TABLE tarefas (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('fiscal', 'recorrente')),
  meses INTEGER[],
  dias INTEGER[],
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vínculo Empresa ↔ Tarefa ↔ Responsável
CREATE TABLE empresa_tarefas (
  id SERIAL PRIMARY KEY,
  empresa_id INT REFERENCES empresas(id),
  tarefa_id INT REFERENCES tarefas(id),
  responsavel_id INT REFERENCES pessoas(id),
  obs TEXT,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Execuções (atualizado para suportar avulsas)
CREATE TABLE execucoes (
  id SERIAL PRIMARY KEY,
  empresa_tarefa_id INT REFERENCES empresa_tarefas(id),
  responsavel_id INT REFERENCES pessoas(id),
  empresa_nome TEXT,      -- novo: nome da empresa para tarefas avulsas
  tarefa_nome TEXT,       -- novo: nome da tarefa avulsa
  mes_ref DATE NOT NULL,
  vencimento DATE NOT NULL,
  status TEXT CHECK (status IN ('Em aberto','Concluído','Urgente')) DEFAULT 'Em aberto',
  obs TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Login e auth
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
