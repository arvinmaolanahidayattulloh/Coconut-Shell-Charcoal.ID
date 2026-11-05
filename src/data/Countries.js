// Daftar negara + kode telepon internasional (untuk pemilih nomor WhatsApp).
// Format: [ISO-3166 alpha-2, nama (Indonesia), kode telepon]
const RAW = [
  ['AF', 'Afghanistan', '+93'], ['AL', 'Albania', '+355'], ['DZ', 'Aljazair', '+213'],
  ['AS', 'Samoa Amerika', '+1'], ['AD', 'Andorra', '+376'], ['AO', 'Angola', '+244'],
  ['AI', 'Anguilla', '+1'], ['AG', 'Antigua dan Barbuda', '+1'], ['AR', 'Argentina', '+54'],
  ['AM', 'Armenia', '+374'], ['AW', 'Aruba', '+297'], ['AU', 'Australia', '+61'],
  ['AT', 'Austria', '+43'], ['AZ', 'Azerbaijan', '+994'], ['BS', 'Bahama', '+1'],
  ['BH', 'Bahrain', '+973'], ['BD', 'Bangladesh', '+880'], ['BB', 'Barbados', '+1'],
  ['BY', 'Belarus', '+375'], ['BE', 'Belgia', '+32'], ['BZ', 'Belize', '+501'],
  ['BJ', 'Benin', '+229'], ['BM', 'Bermuda', '+1'], ['BT', 'Bhutan', '+975'],
  ['BO', 'Bolivia', '+591'], ['BQ', 'Bonaire', '+599'], ['BA', 'Bosnia dan Herzegovina', '+387'],
  ['BW', 'Botswana', '+267'], ['BR', 'Brasil', '+55'], ['IO', 'Wilayah Samudra Hindia Britania', '+246'],
  ['BN', 'Brunei', '+673'], ['BG', 'Bulgaria', '+359'], ['BF', 'Burkina Faso', '+226'],
  ['BI', 'Burundi', '+257'], ['KH', 'Kamboja', '+855'], ['CM', 'Kamerun', '+237'],
  ['CA', 'Kanada', '+1'], ['CV', 'Tanjung Verde', '+238'], ['KY', 'Kepulauan Cayman', '+1'],
  ['CF', 'Republik Afrika Tengah', '+236'], ['TD', 'Chad', '+235'], ['CL', 'Cile', '+56'],
  ['CN', 'Tiongkok', '+86'], ['CX', 'Pulau Natal', '+61'], ['CC', 'Kepulauan Cocos', '+61'],
  ['CO', 'Kolombia', '+57'], ['KM', 'Komoro', '+269'], ['CG', 'Kongo', '+242'],
  ['CD', 'Republik Demokratik Kongo', '+243'], ['CK', 'Kepulauan Cook', '+682'],
  ['CR', 'Kosta Rika', '+506'], ['CI', 'Pantai Gading', '+225'], ['HR', 'Kroasia', '+385'],
  ['CU', 'Kuba', '+53'], ['CW', 'Curaçao', '+599'], ['CY', 'Siprus', '+357'],
  ['CZ', 'Ceko', '+420'], ['DK', 'Denmark', '+45'], ['DJ', 'Jibuti', '+253'],
  ['DM', 'Dominika', '+1'], ['DO', 'Republik Dominika', '+1'], ['EC', 'Ekuador', '+593'],
  ['EG', 'Mesir', '+20'], ['SV', 'El Salvador', '+503'], ['GQ', 'Guinea Khatulistiwa', '+240'],
  ['ER', 'Eritrea', '+291'], ['EE', 'Estonia', '+372'], ['SZ', 'Eswatini', '+268'],
  ['ET', 'Etiopia', '+251'], ['FK', 'Kepulauan Falkland', '+500'], ['FO', 'Kepulauan Faroe', '+298'],
  ['FJ', 'Fiji', '+679'], ['FI', 'Finlandia', '+358'], ['FR', 'Prancis', '+33'],
  ['GF', 'Guyana Prancis', '+594'], ['PF', 'Polinesia Prancis', '+689'], ['GA', 'Gabon', '+241'],
  ['GM', 'Gambia', '+220'], ['GE', 'Georgia', '+995'], ['DE', 'Jerman', '+49'],
  ['GH', 'Ghana', '+233'], ['GI', 'Gibraltar', '+350'], ['GR', 'Yunani', '+30'],
  ['GL', 'Greenland', '+299'], ['GD', 'Grenada', '+1'], ['GP', 'Guadeloupe', '+590'],
  ['GU', 'Guam', '+1'], ['GT', 'Guatemala', '+502'], ['GG', 'Guernsey', '+44'],
  ['GN', 'Guinea', '+224'], ['GW', 'Guinea-Bissau', '+245'], ['GY', 'Guyana', '+592'],
  ['HT', 'Haiti', '+509'], ['HN', 'Honduras', '+504'], ['HK', 'Hong Kong', '+852'],
  ['HU', 'Hungaria', '+36'], ['IS', 'Islandia', '+354'], ['IN', 'India', '+91'],
  ['ID', 'Indonesia', '+62'], ['IR', 'Iran', '+98'], ['IQ', 'Irak', '+964'],
  ['IE', 'Irlandia', '+353'], ['IM', 'Pulau Man', '+44'], ['IL', 'Israel', '+972'],
  ['IT', 'Italia', '+39'], ['JM', 'Jamaika', '+1'], ['JP', 'Jepang', '+81'],
  ['JE', 'Jersey', '+44'], ['JO', 'Yordania', '+962'], ['KZ', 'Kazakhstan', '+7'],
  ['KE', 'Kenya', '+254'], ['KI', 'Kiribati', '+686'], ['XK', 'Kosovo', '+383'],
  ['KW', 'Kuwait', '+965'], ['KG', 'Kirgizstan', '+996'], ['LA', 'Laos', '+856'],
  ['LV', 'Latvia', '+371'], ['LB', 'Lebanon', '+961'], ['LS', 'Lesotho', '+266'],
  ['LR', 'Liberia', '+231'], ['LY', 'Libya', '+218'], ['LI', 'Liechtenstein', '+423'],
  ['LT', 'Lituania', '+370'], ['LU', 'Luksemburg', '+352'], ['MO', 'Makau', '+853'],
  ['MG', 'Madagaskar', '+261'], ['MW', 'Malawi', '+265'], ['MY', 'Malaysia', '+60'],
  ['MV', 'Maladewa', '+960'], ['ML', 'Mali', '+223'], ['MT', 'Malta', '+356'],
  ['MH', 'Kepulauan Marshall', '+692'], ['MQ', 'Martinik', '+596'], ['MR', 'Mauritania', '+222'],
  ['MU', 'Mauritius', '+230'], ['YT', 'Mayotte', '+262'], ['MX', 'Meksiko', '+52'],
  ['FM', 'Mikronesia', '+691'], ['MD', 'Moldova', '+373'], ['MC', 'Monako', '+377'],
  ['MN', 'Mongolia', '+976'], ['ME', 'Montenegro', '+382'], ['MS', 'Montserrat', '+1'],
  ['MA', 'Maroko', '+212'], ['MZ', 'Mozambik', '+258'], ['MM', 'Myanmar', '+95'],
  ['NA', 'Namibia', '+264'], ['NR', 'Nauru', '+674'], ['NP', 'Nepal', '+977'],
  ['NL', 'Belanda', '+31'], ['NC', 'Kaledonia Baru', '+687'], ['NZ', 'Selandia Baru', '+64'],
  ['NI', 'Nikaragua', '+505'], ['NE', 'Niger', '+227'], ['NG', 'Nigeria', '+234'],
  ['NU', 'Niue', '+683'], ['NF', 'Pulau Norfolk', '+672'], ['KP', 'Korea Utara', '+850'],
  ['MK', 'Makedonia Utara', '+389'], ['MP', 'Kepulauan Mariana Utara', '+1'], ['NO', 'Norwegia', '+47'],
  ['OM', 'Oman', '+968'], ['PK', 'Pakistan', '+92'], ['PW', 'Palau', '+680'],
  ['PS', 'Palestina', '+970'], ['PA', 'Panama', '+507'], ['PG', 'Papua Nugini', '+675'],
  ['PY', 'Paraguay', '+595'], ['PE', 'Peru', '+51'], ['PH', 'Filipina', '+63'],
  ['PL', 'Polandia', '+48'], ['PT', 'Portugal', '+351'], ['PR', 'Puerto Riko', '+1'],
  ['QA', 'Qatar', '+974'], ['RE', 'Réunion', '+262'], ['RO', 'Rumania', '+40'],
  ['RU', 'Rusia', '+7'], ['RW', 'Rwanda', '+250'], ['BL', 'Saint Barthélemy', '+590'],
  ['SH', 'Saint Helena', '+290'], ['KN', 'Saint Kitts dan Nevis', '+1'], ['LC', 'Saint Lucia', '+1'],
  ['MF', 'Saint Martin', '+590'], ['PM', 'Saint Pierre dan Miquelon', '+508'],
  ['VC', 'Saint Vincent dan Grenadine', '+1'], ['WS', 'Samoa', '+685'], ['SM', 'San Marino', '+378'],
  ['ST', 'Sao Tome dan Principe', '+239'], ['SA', 'Arab Saudi', '+966'], ['SN', 'Senegal', '+221'],
  ['RS', 'Serbia', '+381'], ['SC', 'Seychelles', '+248'], ['SL', 'Sierra Leone', '+232'],
  ['SG', 'Singapura', '+65'], ['SX', 'Sint Maarten', '+1'], ['SK', 'Slovakia', '+421'],
  ['SI', 'Slovenia', '+386'], ['SB', 'Kepulauan Solomon', '+677'], ['SO', 'Somalia', '+252'],
  ['ZA', 'Afrika Selatan', '+27'], ['KR', 'Korea Selatan', '+82'], ['SS', 'Sudan Selatan', '+211'],
  ['ES', 'Spanyol', '+34'], ['LK', 'Sri Lanka', '+94'], ['SD', 'Sudan', '+249'],
  ['SR', 'Suriname', '+597'], ['SJ', 'Svalbard dan Jan Mayen', '+47'], ['SE', 'Swedia', '+46'],
  ['CH', 'Swiss', '+41'], ['SY', 'Suriah', '+963'], ['TW', 'Taiwan', '+886'],
  ['TJ', 'Tajikistan', '+992'], ['TZ', 'Tanzania', '+255'], ['TH', 'Thailand', '+66'],
  ['TL', 'Timor Leste', '+670'], ['TG', 'Togo', '+228'], ['TK', 'Tokelau', '+690'],
  ['TO', 'Tonga', '+676'], ['TT', 'Trinidad dan Tobago', '+1'], ['TN', 'Tunisia', '+216'],
  ['TR', 'Turki', '+90'], ['TM', 'Turkmenistan', '+993'], ['TC', 'Kepulauan Turks dan Caicos', '+1'],
  ['TV', 'Tuvalu', '+688'], ['UG', 'Uganda', '+256'], ['UA', 'Ukraina', '+380'],
  ['AE', 'Uni Emirat Arab', '+971'], ['GB', 'Inggris Raya', '+44'], ['US', 'Amerika Serikat', '+1'],
  ['UY', 'Uruguay', '+598'], ['UZ', 'Uzbekistan', '+998'], ['VU', 'Vanuatu', '+678'],
  ['VA', 'Vatikan', '+379'], ['VE', 'Venezuela', '+58'], ['VN', 'Vietnam', '+84'],
  ['VG', 'Kepulauan Virgin Britania', '+1'], ['VI', 'Kepulauan Virgin AS', '+1'],
  ['WF', 'Wallis dan Futuna', '+681'], ['EH', 'Sahara Barat', '+212'], ['YE', 'Yaman', '+967'],
  ['ZM', 'Zambia', '+260'], ['ZW', 'Zimbabwe', '+263'], ['AX', 'Kepulauan Åland', '+358'],
];

// Negara yang paling sering dipakai ditaruh di atas daftar
const PINNED = ['ID', 'SG', 'MY', 'CN', 'US', 'JP', 'KR', 'AU', 'IN', 'SA', 'AE', 'NL', 'DE', 'GB'];

const all = RAW.map(([iso, name, dial]) => ({ iso, name, dial }));

const pinned = PINNED.map((iso) => all.find((c) => c.iso === iso)).filter(Boolean);
const rest = all
  .filter((c) => !PINNED.includes(c.iso))
  .sort((a, b) => a.name.localeCompare(b.name, 'id'));

export const COUNTRIES = [...pinned, ...rest];
export const PINNED_COUNT = pinned.length;
export const DEFAULT_ISO = 'ID';

export const getCountry = (iso) =>
  COUNTRIES.find((c) => c.iso === iso) || COUNTRIES[0];
