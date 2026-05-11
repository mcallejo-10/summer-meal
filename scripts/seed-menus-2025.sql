-- Seed Menú Personal 2025
-- Executa a Supabase SQL Editor
-- Esborra primer els menús existents si vols partir de zero:
-- DELETE FROM public.menus;

INSERT INTO public.menus (dish_name, diet_type, meal_type, day) VALUES

-- ─── DINAR ────────────────────────────────────────────────────────────────────

-- Dilluns
('Salchicha',                                                     'omnivora',    'dinar', 'dilluns'),
('Amanida Verda (Enciam, Tomàquet, Ceba, Pastanaga, Remolatxa)', 'vegetariana', 'dinar', 'dilluns'),
('Hamburguesa de Carxofa',                                        'vegana',      'dinar', 'dilluns'),

-- Dimarts
('Llom a la Planxa',                                              'omnivora',    'dinar', 'dimarts'),
('Arrós amb Verdures al Wok',                                     'vegetariana', 'dinar', 'dimarts'),
('Saltat de Xampinyons i Pèsols',                                 'vegana',      'dinar', 'dimarts'),

-- Dimecres
('Pollastre Empanat amb Patates Fregides',                        'omnivora',    'dinar', 'dimecres'),
('Pasta (Bolonyesa, Napolitana, Pesto)',                           'vegetariana', 'dinar', 'dimecres'),
('Bròquil Saltat amb Ametlles',                                   'vegana',      'dinar', 'dimecres'),

-- Dijous
('Albergínia Farcida de Carn',                                    'omnivora',    'dinar', 'dijous'),
('Amanida de Cigrons (Tomàquet, Ceba, Pebrot, Olives, Ou dur, Tonyina)', 'vegetariana', 'dinar', 'dijous'),
('Albergínia Farcida de Verdures',                                'vegana',      'dinar', 'dijous'),

-- Divendres
('Paella o Fideuà',                                               'omnivora',    'dinar', 'divendres'),
('Paella de Verdures',                                            'vegetariana', 'dinar', 'divendres'),

-- Dissabte
('Filet de Vedella amb Patates Fregides',                         'omnivora',    'dinar', 'dissabte'),
('Amanida Russa',                                                 'vegetariana', 'dinar', 'dissabte'),
('Sanfaina amb Llegums',                                          'vegana',      'dinar', 'dissabte'),

-- Diumenge
('Pechuga de Pollastre',                                          'omnivora',    'dinar', 'diumenge'),
('Arrós a la Cubana',                                             'vegetariana', 'dinar', 'diumenge'),
('Ous Ferrats',                                                   'vegetariana', 'dinar', 'diumenge'),
('Fajitas Veganes',                                               'vegana',      'dinar', 'diumenge'),

-- ─── SOPAR ────────────────────────────────────────────────────────────────────

-- Dilluns
('Pizza',                                                         'omnivora',    'sopar', 'dilluns'),

-- Dimarts
('Variat Croquetes (Pollastre o Bolets)',                         'omnivora',    'sopar', 'dimarts'),
('Amanida de Patata (Tomàquet, Pastanaga, Ceba, Pebrot, Olives, Ou dur, Tonyina)', 'vegetariana', 'sopar', 'dimarts'),
('Tofu Saltat a la Soja amb Ceba i Pebrot',                       'vegana',      'sopar', 'dimarts'),

-- Dimecres
('Peix a la Planxa',                                              'omnivora',    'sopar', 'dimecres'),
('Verdura Saltejada',                                             'vegetariana', 'sopar', 'dimecres'),
('Soja Texturitzada amb Arròs',                                   'vegana',      'sopar', 'dimecres'),

-- Dijous
('Canelons de Carn',                                              'omnivora',    'sopar', 'dijous'),
('Tempura de Verdures',                                           'vegetariana', 'sopar', 'dijous'),
('Canelons Vegetals',                                             'vegana',      'sopar', 'dijous'),

-- Divendres
('Pèsols Saltats amb Pernil',                                     'omnivora',    'sopar', 'divendres'),
('Hamburguesa de Vedella amb Patates Fregides',                   'omnivora',    'sopar', 'divendres'),
('Pèsols Saltats amb Verdures',                                   'vegetariana', 'sopar', 'divendres'),
('Hamburguesa Heura amb Patates Fregides',                        'vegana',      'sopar', 'divendres'),

-- Dissabte
('Pollastre al Forn amb Patates',                                 'omnivora',    'sopar', 'dissabte'),
('Amanida de Mozzarella',                                         'vegetariana', 'sopar', 'dissabte'),
('Hummus',                                                        'vegana',      'sopar', 'dissabte'),

-- Diumenge
('Amanida de Llegums',                                            'vegetariana', 'sopar', 'diumenge'),
('Postre Especial',                                               'vegana',      'sopar', 'diumenge');
