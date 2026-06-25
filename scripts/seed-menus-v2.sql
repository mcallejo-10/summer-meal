-- Seed menus_v2 — Plats amb primer i segon (curs d'estiu 2025)
-- Executa al Supabase SQL Editor
-- Per esborrar i tornar a començar:
-- DELETE FROM public.menus_v2;

INSERT INTO public.menus_v2 (dish_name, diet_type, meal_type, day, course) VALUES

-- ════════════════════════════════════════════════════════════════════════════
-- DILLUNS
-- ════════════════════════════════════════════════════════════════════════════

-- Dilluns · Dinar · Primers
('Amanida verda amb tomàquet i enciam',              'omnivora',    'dinar', 'dilluns', 'primer'),
('Amanida verda amb tomàquet i enciam',              'vegetariana', 'dinar', 'dilluns', 'primer'),
('Crema de carbassó',                                'vegana',      'dinar', 'dilluns', 'primer'),

-- Dilluns · Dinar · Segons
('Escalopa de vedella amb patates fregides',         'omnivora',    'dinar', 'dilluns', 'segon'),
('Truita de patata amb pebrot',                      'vegetariana', 'dinar', 'dilluns', 'segon'),
('Tofu a la planxa amb verdures saltades',           'vegana',      'dinar', 'dilluns', 'segon'),

-- Dilluns · Sopar · Primers
('Sopa de fideus',                                   'omnivora',    'sopar', 'dilluns', 'primer'),
('Sopa de verdures',                                 'vegetariana', 'sopar', 'dilluns', 'primer'),
('Sopa de verdures',                                 'vegana',      'sopar', 'dilluns', 'primer'),

-- Dilluns · Sopar · Segons
('Pizza de pernil i formatge',                       'omnivora',    'sopar', 'dilluns', 'segon'),
('Pizza de verdures i formatge',                     'vegetariana', 'sopar', 'dilluns', 'segon'),
('Pizza vegana de bolets i rúcula',                  'vegana',      'sopar', 'dilluns', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DIMARTS
-- ════════════════════════════════════════════════════════════════════════════

-- Dimarts · Dinar · Primers
('Macarrons al tomàquet',                            'omnivora',    'dinar', 'dimarts', 'primer'),
('Macarrons al pesto',                               'vegetariana', 'dinar', 'dimarts', 'primer'),
('Macarrons al pesto',                               'vegana',      'dinar', 'dimarts', 'primer'),

-- Dimarts · Dinar · Segons
('Pit de pollastre a la planxa',                     'omnivora',    'dinar', 'dimarts', 'segon'),
('Ous ferrats amb escalivada',                       'vegetariana', 'dinar', 'dimarts', 'segon'),
('Hamburguesa vegana de cigrons amb amanida',        'vegana',      'dinar', 'dimarts', 'segon'),

-- Dimarts · Sopar · Primers
('Amanida de pasta freda',                           'omnivora',    'sopar', 'dimarts', 'primer'),
('Amanida de pasta freda amb olives',                'vegetariana', 'sopar', 'dimarts', 'primer'),
('Amanida de pasta freda amb olives',                'vegana',      'sopar', 'dimarts', 'primer'),

-- Dimarts · Sopar · Segons
('Croquetes de pollastre amb patates',               'omnivora',    'sopar', 'dimarts', 'segon'),
('Croquetes de bolets amb patates',                  'vegetariana', 'sopar', 'dimarts', 'segon'),
('Falafel amb hummus i pa de pita',                  'vegana',      'sopar', 'dimarts', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DIMECRES
-- ════════════════════════════════════════════════════════════════════════════

-- Dimecres · Dinar · Primers
('Arròs blanc amb tomàquet',                         'omnivora',    'dinar', 'dimecres', 'primer'),
('Arròs blanc amb tomàquet',                         'vegetariana', 'dinar', 'dimecres', 'primer'),
('Arròs saltat amb verdures',                        'vegana',      'dinar', 'dimecres', 'primer'),

-- Dimecres · Dinar · Segons
('Llom de porc al forn amb patates',                 'omnivora',    'dinar', 'dimecres', 'segon'),
('Albergínia farcida de verdures i formatge',        'vegetariana', 'dinar', 'dimecres', 'segon'),
('Albergínia farcida de verdures i llegums',         'vegana',      'dinar', 'dimecres', 'segon'),

-- Dimecres · Sopar · Primers
('Gaspatxo andalús',                                 'omnivora',    'sopar', 'dimecres', 'primer'),
('Gaspatxo andalús',                                 'vegetariana', 'sopar', 'dimecres', 'primer'),
('Gaspatxo andalús',                                 'vegana',      'sopar', 'dimecres', 'primer'),

-- Dimecres · Sopar · Segons
('Peix blanc a la planxa amb llimona',               'omnivora',    'sopar', 'dimecres', 'segon'),
('Truita francesa amb amanida',                      'vegetariana', 'sopar', 'dimecres', 'segon'),
('Tempura de verdures amb salsa de soja',            'vegana',      'sopar', 'dimecres', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DIJOUS
-- ════════════════════════════════════════════════════════════════════════════

-- Dijous · Dinar · Primers
('Llenties estofades amb verdures',                  'omnivora',    'dinar', 'dijous', 'primer'),
('Llenties estofades amb verdures',                  'vegetariana', 'dinar', 'dijous', 'primer'),
('Llenties estofades amb verdures',                  'vegana',      'dinar', 'dijous', 'primer'),

-- Dijous · Dinar · Segons
('Filet de vedella a la planxa amb patates',         'omnivora',    'dinar', 'dijous', 'segon'),
('Canelons de ricotta i espinacs',                   'vegetariana', 'dinar', 'dijous', 'segon'),
('Canelons de tofu i espinacs',                      'vegana',      'dinar', 'dijous', 'segon'),

-- Dijous · Sopar · Primers
('Crema de tomàquet amb brescat',                    'omnivora',    'sopar', 'dijous', 'primer'),
('Crema de tomàquet amb brescat',                    'vegetariana', 'sopar', 'dijous', 'primer'),
('Crema de tomàquet amb brescat',                    'vegana',      'sopar', 'dijous', 'primer'),

-- Dijous · Sopar · Segons
('Hamburguesa de vedella amb patates fregides',      'omnivora',    'sopar', 'dijous', 'segon'),
('Hamburguesa de formatge i ceba caramel·litzada',   'vegetariana', 'sopar', 'dijous', 'segon'),
('Hamburguesa Heura amb enciam i tomàquet',          'vegana',      'sopar', 'dijous', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DIVENDRES
-- ════════════════════════════════════════════════════════════════════════════

-- Divendres · Dinar · Primers
('Paella de pollastre i conill',                     'omnivora',    'dinar', 'divendres', 'primer'),
('Paella de verdures',                               'vegetariana', 'dinar', 'divendres', 'primer'),
('Arròs saltat amb bolets i pèsols',                 'vegana',      'dinar', 'divendres', 'primer'),

-- Divendres · Dinar · Segons
('Calamars a la romana amb amanida',                 'omnivora',    'dinar', 'divendres', 'segon'),
('Cous-cous de verdures',                            'vegetariana', 'dinar', 'divendres', 'segon'),
('Cous-cous de verdures',                            'vegana',      'dinar', 'divendres', 'segon'),

-- Divendres · Sopar · Primers
('Amanida de cigrons amb tomàquet i olives',         'omnivora',    'sopar', 'divendres', 'primer'),
('Amanida de cigrons amb tomàquet i olives',         'vegetariana', 'sopar', 'divendres', 'primer'),
('Amanida de cigrons amb tomàquet i olives',         'vegana',      'sopar', 'divendres', 'primer'),

-- Divendres · Sopar · Segons
('Pèsols saltats amb pernil i ou',                   'omnivora',    'sopar', 'divendres', 'segon'),
('Pèsols saltats amb ou ferrat',                     'vegetariana', 'sopar', 'divendres', 'segon'),
('Pèsols saltats amb tofu fumat',                    'vegana',      'sopar', 'divendres', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DISSABTE
-- ════════════════════════════════════════════════════════════════════════════

-- Dissabte · Dinar · Primers
('Fideuà de marisc',                                 'omnivora',    'dinar', 'dissabte', 'primer'),
('Fideuà de verdures',                               'vegetariana', 'dinar', 'dissabte', 'primer'),
('Fideuà de verdures',                               'vegana',      'dinar', 'dissabte', 'primer'),

-- Dissabte · Dinar · Segons
('Pollastre al forn amb patates i romero',           'omnivora',    'dinar', 'dissabte', 'segon'),
('Lasanya de verdures',                              'vegetariana', 'dinar', 'dissabte', 'segon'),
('Lasanya de verdures vegana',                       'vegana',      'dinar', 'dissabte', 'segon'),

-- Dissabte · Sopar · Primers
('Amanida de meló amb pernil dolç',                  'omnivora',    'sopar', 'dissabte', 'primer'),
('Amanida caprese de mozzarella i tomàquet',         'vegetariana', 'sopar', 'dissabte', 'primer'),
('Amanida de síndria amb menta',                     'vegana',      'sopar', 'dissabte', 'primer'),

-- Dissabte · Sopar · Segons
('Costelles de porc a la brasa',                     'omnivora',    'sopar', 'dissabte', 'segon'),
('Ratatouille al forn amb pa',                       'vegetariana', 'sopar', 'dissabte', 'segon'),
('Ratatouille al forn amb pa',                       'vegana',      'sopar', 'dissabte', 'segon'),

-- ════════════════════════════════════════════════════════════════════════════
-- DIUMENGE
-- ════════════════════════════════════════════════════════════════════════════

-- Diumenge · Dinar · Primers
('Escudella i carn d''olla',                          'omnivora',    'dinar', 'diumenge', 'primer'),
('Crema de carbassa al curri',                       'vegetariana', 'dinar', 'diumenge', 'primer'),
('Crema de carbassa al curri',                       'vegana',      'dinar', 'diumenge', 'primer'),

-- Diumenge · Dinar · Segons
('Entrecot de vedella amb patates i amanida',        'omnivora',    'dinar', 'diumenge', 'segon'),
('Parmigiana d''albergínia',                          'vegetariana', 'dinar', 'diumenge', 'segon'),
('Parmigiana d''albergínia vegana',                   'vegana',      'dinar', 'diumenge', 'segon'),

-- Diumenge · Sopar · Primers
('Amanida mixta amb atun i ou dur',                  'omnivora',    'sopar', 'diumenge', 'primer'),
('Amanida mixta amb ou dur',                         'vegetariana', 'sopar', 'diumenge', 'primer'),
('Amanida mixta amb llavors i germinats',            'vegana',      'sopar', 'diumenge', 'primer'),

-- Diumenge · Sopar · Segons
('Truites variades (pollastre, carn, patata)',       'omnivora',    'sopar', 'diumenge', 'segon'),
('Truita de patata amb ceba',                        'vegetariana', 'sopar', 'diumenge', 'segon'),
('Dhal de llenties vermelles al curri',              'vegana',      'sopar', 'diumenge', 'segon');
