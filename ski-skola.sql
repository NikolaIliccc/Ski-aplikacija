--
-- PostgreSQL database dump
--

\restrict HgvKJ6hMt1hHxfdyRTTVnXEKAMcHbx7JcbTc0D8pJSQNwSWeG8WXk2WZqgZrG6k

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3
--Admin gmail i sifra: admin@gmail.com admin123, menadzer: booker@gmail.com 123456, instruktor: nikola@gmail.com nikola123
-- Started on 2026-08-26 11:25:39

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 234 (class 1259 OID 24760)
-- Name: ai_procene; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_procene (
    id integer NOT NULL,
    korisnik_id integer NOT NULL,
    zahtev_rezervacije_id integer,
    disciplina character varying(20) NOT NULL,
    iskustvo character varying(100) NOT NULL,
    koristi_zicaru boolean NOT NULL,
    kontrolise_brzinu boolean NOT NULL,
    paralelni_zavoji boolean NOT NULL,
    sigurnost_na_stazi character varying(100) NOT NULL,
    procenjeni_nivo character varying(30) NOT NULL,
    preporuceni_tip_casa character varying(30) NOT NULL,
    obrazlozenje text NOT NULL,
    datum_procene timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.ai_procene OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 24759)
-- Name: ai_procene_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_procene_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_procene_id_seq OWNER TO postgres;

--
-- TOC entry 5060 (class 0 OID 0)
-- Dependencies: 233
-- Name: ai_procene_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_procene_id_seq OWNED BY public.ai_procene.id;


--
-- TOC entry 230 (class 1259 OID 16486)
-- Name: instructor_unavailability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instructor_unavailability (
    id integer NOT NULL,
    instructor_id integer,
    unavailable_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instructor_unavailability OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16485)
-- Name: instructor_unavailability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instructor_unavailability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instructor_unavailability_id_seq OWNER TO postgres;

--
-- TOC entry 5061 (class 0 OID 0)
-- Dependencies: 229
-- Name: instructor_unavailability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instructor_unavailability_id_seq OWNED BY public.instructor_unavailability.id;


--
-- TOC entry 222 (class 1259 OID 16404)
-- Name: instructors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.instructors (
    id integer NOT NULL,
    user_id integer,
    snowboard_license boolean,
    experience_level character varying(50),
    ski_license boolean DEFAULT true,
    image_url text
);


ALTER TABLE public.instructors OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16403)
-- Name: instructors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.instructors_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instructors_id_seq OWNER TO postgres;

--
-- TOC entry 5062 (class 0 OID 0)
-- Dependencies: 221
-- Name: instructors_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.instructors_id_seq OWNED BY public.instructors.id;


--
-- TOC entry 232 (class 1259 OID 16505)
-- Name: lesson_change_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_change_requests (
    id integer NOT NULL,
    lesson_id integer,
    user_id integer,
    requested_date date,
    requested_time time without time zone,
    reason text,
    booker_response text,
    status character varying(30) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.lesson_change_requests OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 16504)
-- Name: lesson_change_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lesson_change_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lesson_change_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5063 (class 0 OID 0)
-- Dependencies: 231
-- Name: lesson_change_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lesson_change_requests_id_seq OWNED BY public.lesson_change_requests.id;


--
-- TOC entry 228 (class 1259 OID 16449)
-- Name: lesson_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lesson_requests (
    id integer NOT NULL,
    lesson_type character varying(30),
    preferred_date date,
    preferred_time time without time zone,
    duration_minutes integer,
    note text,
    status character varying(30) DEFAULT 'pending'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    number_of_lessons integer DEFAULT 1,
    lesson_mode character varying(30) DEFAULT 'individual'::character varying,
    group_package character varying(50),
    client_first_name character varying(100),
    client_last_name character varying(100),
    client_age integer,
    client_phone character varying(50),
    client_skill_level character varying(50),
    parent_name character varying(100),
    parent_phone character varying(50),
    cancel_reason text,
    first_time boolean DEFAULT false,
    user_id integer
);


ALTER TABLE public.lesson_requests OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16448)
-- Name: lesson_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lesson_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lesson_requests_id_seq OWNER TO postgres;

--
-- TOC entry 5064 (class 0 OID 0)
-- Dependencies: 227
-- Name: lesson_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lesson_requests_id_seq OWNED BY public.lesson_requests.id;


--
-- TOC entry 226 (class 1259 OID 16431)
-- Name: lessons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.lessons (
    id integer NOT NULL,
    instructor_id integer,
    lesson_type character varying(20),
    lesson_date date,
    start_time time without time zone,
    end_time time without time zone,
    status character varying(20),
    request_id integer
);


ALTER TABLE public.lessons OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16430)
-- Name: lessons_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.lessons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.lessons_id_seq OWNER TO postgres;

--
-- TOC entry 5065 (class 0 OID 0)
-- Dependencies: 225
-- Name: lessons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.lessons_id_seq OWNED BY public.lessons.id;


--
-- TOC entry 224 (class 1259 OID 16418)
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id integer NOT NULL,
    parent_id integer,
    first_name character varying(100),
    last_name character varying(100),
    age integer,
    skill_level character varying(50)
);


ALTER TABLE public.students OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16417)
-- Name: students_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.students_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.students_id_seq OWNER TO postgres;

--
-- TOC entry 5066 (class 0 OID 0)
-- Dependencies: 223
-- Name: students_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.students_id_seq OWNED BY public.students.id;


--
-- TOC entry 220 (class 1259 OID 16393)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying(100),
    email character varying(100),
    password character varying(255),
    role character varying(20),
    failed_login_attempts integer DEFAULT 0,
    locked_until timestamp without time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16392)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5067 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4862 (class 2604 OID 24763)
-- Name: ai_procene id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_procene ALTER COLUMN id SET DEFAULT nextval('public.ai_procene_id_seq'::regclass);


--
-- TOC entry 4857 (class 2604 OID 16489)
-- Name: instructor_unavailability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor_unavailability ALTER COLUMN id SET DEFAULT nextval('public.instructor_unavailability_id_seq'::regclass);


--
-- TOC entry 4847 (class 2604 OID 16407)
-- Name: instructors id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructors ALTER COLUMN id SET DEFAULT nextval('public.instructors_id_seq'::regclass);


--
-- TOC entry 4859 (class 2604 OID 16508)
-- Name: lesson_change_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_change_requests ALTER COLUMN id SET DEFAULT nextval('public.lesson_change_requests_id_seq'::regclass);


--
-- TOC entry 4851 (class 2604 OID 16452)
-- Name: lesson_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_requests ALTER COLUMN id SET DEFAULT nextval('public.lesson_requests_id_seq'::regclass);


--
-- TOC entry 4850 (class 2604 OID 16434)
-- Name: lessons id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons ALTER COLUMN id SET DEFAULT nextval('public.lessons_id_seq'::regclass);


--
-- TOC entry 4849 (class 2604 OID 16421)
-- Name: students id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students ALTER COLUMN id SET DEFAULT nextval('public.students_id_seq'::regclass);


--
-- TOC entry 4844 (class 2604 OID 16396)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5054 (class 0 OID 24760)
-- Dependencies: 234
-- Data for Name: ai_procene; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ai_procene (id, korisnik_id, zahtev_rezervacije_id, disciplina, iskustvo, koristi_zicaru, kontrolise_brzinu, paralelni_zavoji, sigurnost_na_stazi, procenjeni_nivo, preporuceni_tip_casa, obrazlozenje, datum_procene) FROM stdin;
1	20	\N	ski	Skijao sam nekoliko dana	t	t	f	Siguran sam na plavim stazama, ali nisam siguran na crvenim	intermediate	individual	Samostalno koristi žičaru i kontroliše brzinu, ali ne izvodi paralelne zavoje i nije siguran na crvenim stazama. Preporučujem individualni čas za korekciju tehnike i povećanje sigurnosti.	2026-08-19 14:05:35.446668
2	24	\N	ski	Imam jednu sezonu iskustva	t	t	f	Siguran sam samo na lakšim i plavim stazama	intermediate	individual	Ima sezonu iskustva, samostalno koristi žičaru i kontroliše brzinu, što odgovara intermedijatu. Ne izvodi paralelne zavoje i ograničen je na lakše/plave staze. Preporučujem individualni čas za fokusiran rad na tehnici i povećanje sigurnosti.	2026-08-19 14:16:42.39023
3	24	\N	ski	Skijao/vozio sam nekoliko dana	f	f	f	Siguran sam samo na lakšim i plavim stazama	beginner	individual	Nedovoljna kontrola brzine, nemogućnost izvođenja paralelnih zavoja i nesamostalno korišćenje žičare ukazuju na početni nivo. Siguran je samo na lakšim stazama, pa je potreban individualni čas radi bezbednosti i ciljane korekcije tehnike.	2026-08-19 14:17:52.410962
4	24	\N	ski	Imam jednu sezonu iskustva	t	f	f	Siguran sam samo na lakšim i plavim stazama	beginner	individual	Korisnik nema sigurnu kontrolu brzine niti izvodi paralelne zavoje i oseća se sigurno samo na lakim/plavim stazama, što odgovara beginner nivou. Ima 11 godina ali ne ispunjava uslov za grupni čas (ne kontroliše bezbedno brzinu), pa je preporuka individualni čas radi bezbednosti i bržeg napretka.	2026-08-19 14:27:00.873929
5	24	\N	ski	Imam jednu sezonu iskustva	t	t	f	Siguran sam na plavim stazama, ali nisam potpuno siguran na crvenim	intermediate	individual	Imate sezonu iskustva, samostalno koristite žičaru i bezbedno kontrolišete brzinu, što odgovara intermediate nivou. Pošto imate 11 godina, ali još ne izvodite paralelne zavoje i niste potpuno sigurni na crvenim stazama, preporučujem individualni čas radi bržeg napretka i veće bezbednosti.	2026-08-19 14:27:38.09325
6	24	\N	ski	Imam jednu sezonu iskustva	t	t	f	Siguran sam na plavim stazama, ali nisam potpuno siguran na crvenim	intermediate	group	Imaš jednu sezonu i samostalno kontrolišeš brzinu i zaustavljanje te si siguran na plavim stazama, što odgovara intermediate nivou. Pošto imaš 11 godina i samostalno koristiš žičaru, ispunjavaš uslove za grupnu nastavu, zato preporučujem group čas.	2026-08-19 14:33:52.36668
7	24	\N	ski	Skijao/vozio sam nekoliko dana	t	t	f	Siguran sam na plavim i crvenim stazama	intermediate	individual	Imate stabilnu kontrolu brzine i zaustavljanja i osećate se sigurno na plavim i crvenim stazama, što odgovara intermediate nivou; nedostatak paralelnih zavoja ne menja procenu. Pošto imate preko 12 godina, preporučujem individualni čas radi fokusiranog usavršavanja tehnike.	2026-08-24 23:21:12.386499
8	24	\N	ski	Skijao/vozio sam nekoliko dana	t	f	f	Siguran sam samo na lakšim i plavim stazama	beginner	individual	Korisnik je početnik jer još ne kontroliše bezbedno brzinu i zaustavljanje. Iako samostalno koristi žičaru, zbog nedostatka kontrole brzine i zaustavljanja preporučujem individualni čas radi sigurnijeg i bržeg napretka.	2026-08-24 23:54:41.579807
\.


--
-- TOC entry 5050 (class 0 OID 16486)
-- Dependencies: 230
-- Data for Name: instructor_unavailability; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructor_unavailability (id, instructor_id, unavailable_date, start_time, end_time, reason, created_at) FROM stdin;
\.


--
-- TOC entry 5042 (class 0 OID 16404)
-- Dependencies: 222
-- Data for Name: instructors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.instructors (id, user_id, snowboard_license, experience_level, ski_license, image_url) FROM stdin;
3	5	t	nivo 1	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1786970766/ski-school/instructors/cecuhvmxxy93xfqqeojh.jpg
7	29	f	intermediate	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787144042/ski-school/instructors/sax648rml4otqlepyxyr.jpg
9	31	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145084/ski-school/instructors/npwlrsw1eyi8buj1upth.jpg
10	32	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145110/ski-school/instructors/si51yjn4k9wyx9uzadzq.jpg
11	33	f	intermediate	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145137/ski-school/instructors/gum21mvgkrhmx3hgby7g.jpg
12	34	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145155/ski-school/instructors/njei72yrqixr6vpdkc84.jpg
13	35	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145178/ski-school/instructors/lnaaht4zqzh69xtfv17j.jpg
14	36	f	intermediate	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145208/ski-school/instructors/vnqdnir20mpo56xlcv5t.jpg
15	37	f	advanced	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145227/ski-school/instructors/ypg5kr0pydgcfbomyvn9.jpg
18	40	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145247/ski-school/instructors/tral5vgawdt2sd8wgyi0.jpg
16	38	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145299/ski-school/instructors/v8ge3be1o75uvxlwk6k5.jpg
8	30	f	advanced	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145326/ski-school/instructors/g546kkyd5uegqosdp18x.jpg
17	39	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145349/ski-school/instructors/vyrrluge4x4avkpt3bue.jpg
19	41	f	beginner	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145367/ski-school/instructors/ex2l5tktuqgaux376od2.jpg
1	2	f	intermediate	t	https://res.cloudinary.com/dbif0kg6g/image/upload/v1787145480/ski-school/instructors/axuegr6k6kdaxstave1s.jpg
\.


--
-- TOC entry 5052 (class 0 OID 16505)
-- Dependencies: 232
-- Data for Name: lesson_change_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson_change_requests (id, lesson_id, user_id, requested_date, requested_time, reason, booker_response, status, created_at) FROM stdin;
1	28	9	2026-03-03	10:00:00	Nismo tu taj datum	Odobreno	approved	2026-05-17 20:46:03.011389
4	36	20	2026-02-02	11:00:00	dsfasdf	Promena termina je odobrena.	approved	2026-06-10 17:47:49.625061
5	39	10	2026-02-02	00:00:00	Nisam tada tu idem negde 	Prihvaceno	approved	2026-06-11 13:16:09.574489
6	40	10	2026-02-01	11:00:00	dasas	Promena termina je odobrena.	approved	2026-06-11 13:19:24.111292
8	42	24	2026-04-02	10:00:00	Ne stizem doci u 11 sati.	Odobreno	approved	2026-08-24 23:28:56.277771
\.


--
-- TOC entry 5048 (class 0 OID 16449)
-- Dependencies: 228
-- Data for Name: lesson_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lesson_requests (id, lesson_type, preferred_date, preferred_time, duration_minutes, note, status, created_at, number_of_lessons, lesson_mode, group_package, client_first_name, client_last_name, client_age, client_phone, client_skill_level, parent_name, parent_phone, cancel_reason, first_time, user_id) FROM stdin;
1	ski	2026-05-20	10:00:00	60	Prvi čas skijanja	approved	2026-05-13 13:29:28.200068	1	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
4	ski	2026-05-20	10:00:00	60	Dete prvi put skija	approved	2026-05-15 17:48:43.189092	4	group	4h_no_lunch	Petar	Petrovic	8	061111111	pocetnik	Marko Petrovic	062222222	\N	f	\N
3	ski	2026-05-20	10:00:00	60	Zeli 2 individualna casa	approved	2026-05-14 21:34:08.110464	3	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
2	ski	2027-04-21	09:00:00	60	j	rejected	2026-05-14 21:29:03.322901	1	individual	\N	\N	\N	\N	\N	\N	\N	\N	\N	f	\N
5	ski	2026-05-30	09:00:00	60	Prvi put skija	approved	2026-05-15 21:31:36.260663	2	individual	\N	Stefan	Ilic	22	061123456	pocetnik	\N	\N	\N	t	\N
7	ski	2026-06-05	10:00:00	60	Test zauzetosti instruktora 2	approved	2026-05-15 21:38:01.576499	1	individual	\N	Nikola	Savic	24	062222222	napredni	\N	\N	\N	f	\N
6	ski	2026-06-05	10:00:00	60	Test zauzetosti instruktora 1	approved	2026-05-15 21:37:54.803682	1	individual	\N	Petar	Jovic	20	061111111	srednji	\N	\N	\N	f	\N
11	ski	2026-02-01	00:00:00	60	\N	approved	2026-05-17 12:56:29.527305	2	individual	\N	Milos	Milosevic	26	06412315325	pocetnik	\N	\N	\N	t	9
10	ski	2026-02-01	00:00:00	60	Gde se nalazimo?	rejected	2026-05-16 19:26:28.073136	1	individual	\N	Milos	Milosevic	6	0643213452	pocetnik	Milan Milosevic	0643213452	\N	t	\N
9	ski	2026-02-01	10:00:00	60	Carving	rejected	2026-05-16 17:03:27.579311	1	individual	\N	Marko	Stefanovic	19	06412314421	napredni	\N	\N	\N	f	\N
8	ski	2026-02-20	09:00:00	60	Bili smo samo jednom na skijanju	rejected	2026-05-16 17:01:00.038906	2	individual	\N	Nemanja	Markovic	6	064123124	pocetnik	Zoran Markovic	065213414	\N	f	\N
12	ski	2026-02-01	10:00:00	60	\N	approved	2026-05-17 14:15:54.897769	1	individual	\N	fasfsa	fsfda	22	063452323	srednji	\N	\N	\N	f	9
13	ski	2026-01-02	10:00:00	60	\N	approved	2026-05-17 14:18:43.763	2	individual	\N	sdfgasdfdsf	dsfasdfdsfa	28	063456345	srednji	\N	\N	\N	f	4
14	ski	2026-02-01	09:00:00	60	\N	approved	2026-05-17 14:26:44.30843	1	individual	\N	sfsdfasfd	sdfasfdas	22	064213412	pocetnik	\N	\N	\N	f	9
15	ski	2026-02-01	10:00:00	60	\N	approved	2026-05-17 14:48:26.11012	1	individual	\N	disfgiashdg	igfasioehf	22	064213421	pocetnik	\N	\N	\N	f	4
16	ski	2026-01-02	09:00:00	60	\N	approved	2026-05-17 14:50:22.738227	2	individual	\N	sdafasd	sfasfsa	22	06124124	pocetnik	\N	\N	\N	f	4
18	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 14:53:11.581071	2	individual	\N	marta	dsfasdfdas	21	062343124	pocetnik	\N	\N	\N	f	4
17	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 14:52:25.341846	2	individual	\N	Nikola	dasdfasdf	22	241124124	pocetnik	\N	\N	\N	f	4
20	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 15:10:57.609638	2	individual	\N	martasda	dfsfas	21	062141	pocetnik	\N	\N	\N	f	4
19	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 15:10:31.51466	2	individual	\N	xzfsdaf	asdasdas	21	0623432431	pocetnik	\N	\N	\N	f	4
21	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 15:15:25.083932	2	individual	\N	sdfasdf	dsfasdf	21	5214324	pocetnik	\N	\N	\N	f	4
22	ski	2026-02-02	09:00:00	60	\N	approved	2026-05-17 15:16:52.369838	2	individual	\N	ASDADSSDADSF	FDSFADS	21	064352354	pocetnik	\N	\N	\N	f	4
23	ski	2026-03-22	09:00:00	60	\N	approved	2026-05-17 20:04:33.598515	2	individual	\N	Milan	Nikolic	6	064213415	pocetnik	Zoran Nikolic	064213415	\N	f	\N
24	ski	2026-02-02	13:00:00	60	\N	approved	2026-05-17 20:22:07.802444	1	individual	\N	Momir	mosa	21	061232141	pocetnik	\N	\N	\N	f	9
26	ski	2026-02-01	13:00:00	60	\N	approved	2026-06-01 13:27:50.679866	1	individual	\N	Milos	Stefanovic	20	0641415213	pocetnik	\N	\N	\N	f	\N
25	ski	2026-02-02	14:00:00	60	\N	approved	2026-06-01 13:07:03.456087	1	individual	\N	sdfasf	sdfasdf22	22	062131234	pocetnik	\N	\N	\N	f	\N
29	ski	2026-01-02	15:00:00	60	\N	approved	2026-06-01 13:45:35.884447	1	individual	\N	Marko	Markovic	21	0641341234	pocetnik	\N	\N	\N	f	14
28	ski	2026-02-02	15:00:00	60	\N	approved	2026-06-01 13:39:31.560456	1	individual	\N	Marko	Markovic	21	06421423513	pocetnik	\N	\N	\N	f	\N
27	ski	2026-01-02	13:00:00	60	\N	approved	2026-06-01 13:30:55.532574	2	individual	\N	Marko	Markovic	22	0624141412	srednji	\N	\N	\N	f	\N
30	ski	2026-02-02	11:00:00	60	\N	approved	2026-06-01 13:47:58.853787	1	individual	\N	Milos	Milosevic	10	0642114124	pocetnik	Marko Milosevic	0642114124	\N	f	14
31	ski	2026-02-12	11:00:00	60	\N	approved	2026-06-10 16:53:49.575779	1	individual	\N	sadasda	adsasda	21	994535423	pocetnik	\N	\N	\N	f	20
32	ski	2026-03-12	11:00:00	60	\N	rejected	2026-06-10 16:56:15.261559	1	individual	\N	sadads	asdasdas	21	0532531431	pocetnik	\N	\N	\N	f	4
33	ski	2026-02-22	11:00:00	60	\N	rejected	2026-06-10 17:01:56.266995	1	individual	\N	safdafd	sfdasf	21	353252	pocetnik	\N	\N	\N	f	20
34	ski	2026-02-02	13:00:00	60	\N	approved	2026-06-10 17:21:14.524652	1	individual	\N	Milos	Mirkovic	22	063523412	pocetnik	\N	\N	\N	f	20
35	ski	2026-01-01	10:00:00	60	\N	rejected	2026-06-10 17:22:08.69188	1	individual	\N	safas	fdsafs	22	5477345623	pocetnik	\N	\N	\N	f	4
37	ski	2026-01-02	15:00:00	60	\N	approved	2026-06-10 17:31:08.663607	1	individual	\N	Milos	Stefanovic	23	062131241	pocetnik	\N	\N	\N	f	20
36	ski	2026-02-02	10:00:00	60	\N	approved	2026-06-10 17:30:40.787574	1	individual	\N	Mirko	Mirkovic	22	06124124213	pocetnik	\N	\N	\N	f	20
38	ski	2026-02-01	11:00:00	60	\N	approved	2026-06-11 13:15:04.470286	2	individual	\N	Nikola	Ilic	23	0641241421	pocetnik	\N	\N	\N	f	10
39	ski	2026-01-20	12:00:00	60	\N	approved	2026-06-11 13:18:02.43687	1	individual	\N	Mirko	Mirkovic	22	06312414	pocetnik	\N	\N	\N	f	10
40	ski	2026-02-03	12:00:00	60	Zelim dobrog instruktora	approved	2026-08-17 13:24:29.354788	2	individual	\N	Milica	Stasic	23	064124152	srednji	\N	\N	\N	f	24
41	ski	2026-02-02	10:00:00	60	\N	rejected	2026-08-19 14:37:16.300295	2	group	2h	Nikola	Ilic	11	063211241	srednji	Dragan	063211241	\N	f	24
42	ski	2026-04-02	11:00:00	60	Zelim da naucim paralelno zaokrete	approved	2026-08-24 23:23:59.146021	1	individual	\N	Nikola	Ilic	23	0641342052	srednji	\N	\N	\N	f	24
\.


--
-- TOC entry 5046 (class 0 OID 16431)
-- Dependencies: 226
-- Data for Name: lessons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.lessons (id, instructor_id, lesson_type, lesson_date, start_time, end_time, status, request_id) FROM stdin;
1	1	ski	2026-05-20	10:00:00	11:00:00	cancelled	\N
28	1	ski	2026-03-03	10:00:00	11:00:00	scheduled	24
32	1	ski	2026-02-02	15:00:00	16:00:00	scheduled	28
36	1	ski	2026-02-02	11:00:00	12:00:00	scheduled	34
38	3	ski	2026-02-02	10:00:00	11:00:00	scheduled	36
39	1	ski	2026-02-02	00:00:00	02:00:00	scheduled	38
40	3	ski	2026-02-01	11:00:00	12:00:00	scheduled	39
42	1	ski	2026-04-02	10:00:00	11:00:00	scheduled	42
\.


--
-- TOC entry 5044 (class 0 OID 16418)
-- Dependencies: 224
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, parent_id, first_name, last_name, age, skill_level) FROM stdin;
1	1	Petar	Petrovic	8	pocetnik
2	3	stefan	milic	8	pocetnik
\.


--
-- TOC entry 5040 (class 0 OID 16393)
-- Dependencies: 220
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, password, role, failed_login_attempts, locked_until, is_active) FROM stdin;
1	Marko	marko@gmail.com	$2b$10$7.3qPvqjB1bDEjYRPUTH5Ove6clp/8Dk5pMWkGkHE3XEt1epgbHjq	parent	0	\N	t
9	Milos Milosevic	milos@gmail.com	$2b$10$f7V9w9/TEpObub.Ev.Z4IeoRfRPY7R6oizWdjl7CQ.wzMNWz2fwqK	client	0	\N	t
10	Nikola Ilic	nikolailic683@gmail.com	\N	client	0	\N	t
11	Nikola Ilić	nikola.ilic.5633@metropolitan.ac.rs	\N	client	0	\N	t
12	Marko Stevanovic	markostevanovic232@gmail.com	$2b$10$zyH3Wi1KWus.ONGYOJ32yuvpDiajqiaiMhwPGstzta87Pmv0VLoP6	client	0	\N	t
19	Test user	test1@gmail.com	$2b$10$J.ZG.ipMWFcRKR7jc3HQNu9ubefSLz1nB2Q2LrJ75bdMsZzXg3CgW	client	6	2026-06-10 14:29:25.231622	t
13	AnimalFacts	animaladventures143@gmail.com	\N	client	0	\N	t
15	Nemanja Nemanjic	nemanja@gmail.com	$2b$10$xjZAr4WqI9IyKk0mwcA7oeSZkFlL.gPa/C3QvUBsbH2GXRn6dK2G2	client	0	\N	t
16	Nikola Ilic	nikolaillic@gmail.com	$2b$10$H.Dq7IRPm1NNTeUkjcG3XOPGIsarT7lkMfBas.GZPikhnOF9NubbC	client	0	\N	t
17	Test User	test123@gmail.com	$2b$10$3tUHepZUDdcPUUVOIZ1d6uzCBiTPmJrA7qrDYSvZrsZViBS8fnjkm	client	5	2026-06-02 17:09:55.711124	t
21	nikola ilic	nikolas@gmail.com	$2b$10$GywFfXQHxnGtDhrRSd7uoOPTKwINLxv0smZGkxOrB7CRcH5Abt0Ea	client	0	\N	t
18	Mila Novkovic	milamnovkovic@gmail.com	\N	client	0	\N	t
20	test	test1233@gmail.com	$2b$10$9nhJ2Fhe1EL0OBkf2ukA/.eGmQK2pcdkwik8KNTffHkgBqJ1xEyBi	client	0	\N	t
14	Marko Markovic	markokurac@gmail.com	$2b$10$1HNDnMVU4llip7tTt/WeGOoRpSJRAqij5I/EHPHgwd.c4Kz5ssTGW	client	0	\N	t
22	stefan	stefan@gmail.com	$2b$10$BCwxsPqpNa9SA1ZdrfBM9eOyQYJjG59K/j3DQgVscpc4EugkHueqq	client	0	\N	t
23	marko	marko@gmails.com	$2b$10$dO038A.NfNb2wlmA1JUB9.ddnAbUqKwKarMGzKmfbJiqlPMrawc56	client	0	\N	t
5	Marta Vojvodic	marta@gmail.com	$2b$10$5S4egQIc3PbnkMLfdBNHveGsh67vjI3naBOBAItY8oboKmYiVEWjG	instructor	0	\N	t
3	Test Roditelj	roditelj@test.com	$2b$10$DgXGatbRGrfh9YgHJfX1E.LQM08KrayV9NoP8RfLQkE8b0JEcTe2m	parent	0	\N	f
24	test	testuser@gmail.com	$2b$10$fsxFWmCEZ2DpGJ8dBIlPFOPe61nruML3arVbPLv2f9VUVaJOIIBJy	client	0	\N	t
31	Alen Aziri	alen@gmail.com	$2b$10$zX.vDe1W..Uzpx0wGrQV2OEtmGu9Cw.k0U50JPOB9vac23r6XalI6	instructor	0	\N	t
32	Andrija Arsovic	andrijars@gmail.com	$2b$10$qv.VuuaNkyAsO/hrwjfPHu5ch6y/DYGEWeACrXcndR.8qRxVA0InG	instructor	0	\N	t
29	Andjela Lazovic	andjelaski@gmail.com	$2b$10$woK3mZ/zWhWXXKoEK1OFce.whK7stNfeJjWcMyxx8Q75XY04hsBGa	instructor	0	\N	t
33	Andrija Curcevic	andrija@gmail.com	$2b$10$HjgovbaUZXgxMGQqulnjrOVsna1c2khjXwdeyfRKL6aR55lynB/tO	instructor	0	\N	t
34	Boris Kosic	boris@gmail.com	$2b$10$OpIcXOAVg73GTZbXTB2EkeVOQS4kbWS81KrzpYFRai52RaV.9x3vm	instructor	0	\N	t
35	Branislav Pantelic	panta@gmail.com	$2b$10$0FDJAxnVViNSX7Inv4O/nOt7CIQ5iyfmNm.MCtCLM7NbfifoMaB1a	instructor	0	\N	t
36	Dusan Arsovic	dusan@gmail.com	$2b$10$niVMRp7H5uoVv5vLlnzkp.z0I5aYeYfcg9YikWR.MIUbkLwkdBbze	instructor	0	\N	t
37	Igor Andric	igor@gmail.com	$2b$10$ecAoKboy9ia9FsBujtQBBOQzBkQ61k3jdoYyEpw6B2sRN8V/XPRPq	instructor	0	\N	t
40	Marija Purkovic	marija@gmail.com	$2b$10$Qlvv3vCqTvkpz1hpIsiF0uAKQQJXbio4kyvgxpOFXPay4WlXPKsfG	instructor	0	\N	t
38	Milan Colic	milan@gmail.com	$2b$10$bUtOf4glXOo3GbTNFfZsIed6M2aBvJah4bCr.wlQX4GZrArfh7fbq	instructor	0	\N	t
30	Miroslava Bisercic	miroslav@gmail.com	$2b$10$VNx1vH71Cr4L83DgWXCBKOCsv7bijfFbqfz/3QebOEzBXB.GJoNJK	instructor	0	\N	t
39	Veljko Popovic	veljko@gmail.com	$2b$10$Uh0Tb.6XUkv33xvrofk5ee9CykJvTdqQqAtqC7rrio88m6X8L/74a	instructor	0	\N	t
41	Milenko Purkovic	milenko@gmail.com	$2b$10$MDaWGVAQxeH/qCEX/MpJWOqLW4Wm9MbtVTgRvxYesjYd8bw1B/gKm	instructor	0	\N	t
4	Booker	booker@gmail.com	$2b$10$IsDTwfDtbcrFBe1WyFSatu84QJZmomXukMMc8qUkfxjGFU.8jQGtq	booker	0	\N	t
2	Nikola Ilic	nikola@gmail.com	$2b$10$zVhKiLZV59kDlnTLcE1dmO22khDu2g/0c1XLL3x3HJ0E5BcXUsEAi	instructor	0	\N	t
25	Administrator	admin@gmail.com	$2b$10$H5Tjt1JkPyIBDL/rprnkjeyA/f.DksBeIEoPgWUD7YzwHCM/y1PPS	admin	0	\N	t
\.


--
-- TOC entry 5068 (class 0 OID 0)
-- Dependencies: 233
-- Name: ai_procene_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ai_procene_id_seq', 8, true);


--
-- TOC entry 5069 (class 0 OID 0)
-- Dependencies: 229
-- Name: instructor_unavailability_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.instructor_unavailability_id_seq', 1, true);


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 221
-- Name: instructors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.instructors_id_seq', 20, true);


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 231
-- Name: lesson_change_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lesson_change_requests_id_seq', 8, true);


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 227
-- Name: lesson_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lesson_requests_id_seq', 42, true);


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 225
-- Name: lessons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.lessons_id_seq', 42, true);


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 223
-- Name: students_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.students_id_seq', 2, true);


--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 219
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 42, true);


--
-- TOC entry 4881 (class 2606 OID 24779)
-- Name: ai_procene ai_procene_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_procene
    ADD CONSTRAINT ai_procene_pkey PRIMARY KEY (id);


--
-- TOC entry 4877 (class 2606 OID 16498)
-- Name: instructor_unavailability instructor_unavailability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor_unavailability
    ADD CONSTRAINT instructor_unavailability_pkey PRIMARY KEY (id);


--
-- TOC entry 4869 (class 2606 OID 16410)
-- Name: instructors instructors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_pkey PRIMARY KEY (id);


--
-- TOC entry 4879 (class 2606 OID 16515)
-- Name: lesson_change_requests lesson_change_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_change_requests
    ADD CONSTRAINT lesson_change_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4875 (class 2606 OID 16459)
-- Name: lesson_requests lesson_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_requests
    ADD CONSTRAINT lesson_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4873 (class 2606 OID 16437)
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- TOC entry 4871 (class 2606 OID 16424)
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- TOC entry 4865 (class 2606 OID 16401)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4867 (class 2606 OID 16399)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4890 (class 2606 OID 24780)
-- Name: ai_procene ai_procene_korisnik_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_procene
    ADD CONSTRAINT ai_procene_korisnik_id_fkey FOREIGN KEY (korisnik_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4891 (class 2606 OID 24785)
-- Name: ai_procene ai_procene_zahtev_rezervacije_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_procene
    ADD CONSTRAINT ai_procene_zahtev_rezervacije_id_fkey FOREIGN KEY (zahtev_rezervacije_id) REFERENCES public.lesson_requests(id) ON DELETE SET NULL;


--
-- TOC entry 4887 (class 2606 OID 16499)
-- Name: instructor_unavailability instructor_unavailability_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructor_unavailability
    ADD CONSTRAINT instructor_unavailability_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id) ON DELETE CASCADE;


--
-- TOC entry 4882 (class 2606 OID 16411)
-- Name: instructors instructors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.instructors
    ADD CONSTRAINT instructors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4888 (class 2606 OID 16516)
-- Name: lesson_change_requests lesson_change_requests_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_change_requests
    ADD CONSTRAINT lesson_change_requests_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- TOC entry 4889 (class 2606 OID 16521)
-- Name: lesson_change_requests lesson_change_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_change_requests
    ADD CONSTRAINT lesson_change_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4886 (class 2606 OID 16480)
-- Name: lesson_requests lesson_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lesson_requests
    ADD CONSTRAINT lesson_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4884 (class 2606 OID 16443)
-- Name: lessons lessons_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.instructors(id);


--
-- TOC entry 4885 (class 2606 OID 16472)
-- Name: lessons lessons_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.lesson_requests(id);


--
-- TOC entry 4883 (class 2606 OID 16425)
-- Name: students students_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.users(id);


-- Completed on 2026-08-26 11:25:40

--
-- PostgreSQL database dump complete
--

\unrestrict HgvKJ6hMt1hHxfdyRTTVnXEKAMcHbx7JcbTc0D8pJSQNwSWeG8WXk2WZqgZrG6k

