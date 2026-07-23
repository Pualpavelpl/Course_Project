

## Роли

- **Candidate**  регистрируется и входит через
  Log in as a candidate. Он заполняет Profile, добавляет Projects,
  просматривает доступные Position и создаёт CV.
- **Recruiter** создаёт Admin. Admin указывает email и пароль,
  после чего Recruiter входит через Log in as an employee. Recruiter
  управляет Attribute и Position, просматривает CV и ставит Likes. То есть, чтобы создать рекрутера это делает Admin и подразумевается в дальнейшем интергация с гугл почтой. Админ скидывает на почту рекрутеру его логин и пароль. Сейчас при создании надо запомнить этот логин и пароль, чтобы потом зайти как рекрутер
- **Admin** входит через Log in as an employee. Это Recruiter со связанной
  записью Admin. Он создаёт Recruiter, управляет пользователями и может
  работать с данными Candidate. Первый админ Логин admin@gmail.com пароль 12345678

## Основная логика

- Attribute создаётся один раз и используется в Profile, Position и CV.
- Position содержит упорядоченные Attribute и Tags.
- CV не хранит копию Profile: оно динамически собирается из актуальных данных
  Candidate, Position и Projects.
- Candidate и Recruiter находятся в разных таблицах.
- Пароли хранятся только как bcrypt-хеши, доступ защищён JWT и проверкой роли.

Frontend развёрнут на Vercel, backend и PostgreSQL — на Render.

Файл Figma.txt содержит ссылку на Figma с первоначальным UI
программы, схемой базы данных, ролями и действиями пользователей.
