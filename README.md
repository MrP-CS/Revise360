# Revise 360

A small website that hosts 360° GCSE Computer Science experiences in one place. Students choose a topic, then an experience within it.

- **Students** sign in with their name, class and a 4-digit PIN they make up. Their progress saves after every answer, so they can stop and carry on later, on any device.
- **In each experience**, students answer quiz stations, tap blue **i** markers to find out more (the panel doesn't block the scene), open **My progress**, and use **Review mode** to retry questions they got wrong.
- **On the home screen**, students choose a topic (topics without experiences yet show as Coming soon), then see its experiences with their progress, plus a list of "areas to work on" that links straight to the questions to retry.
- **Teachers** open `teacher.html`, pick a topic, and see every student's progress, the weakest stations for each class, and a per-student breakdown. Results can be downloaded as a CSV.

The first answer to each question is the score that counts. Review mode records whether a student has since fixed a mistake, and the teacher dashboard shows both.

## 7. Data protection: please check before using with students

- The site stores each student's name, class and scores. With step 2 set up, these are saved in **your** Google Sheet. Check with your school's data protection lead that this is acceptable, and use a school Google account if you have one.
- Nothing else is collected: there are no cookies, analytics or adverts.
- The PIN isn't stored. It's combined with the name and class to create an ID for each student. It isn't a strong password, so treat it as a way to keep progress separate between students, not as security.
- To delete a student's data, delete their rows in the Sheet.
