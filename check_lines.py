lines = open('d:/rescuelens/frontend/src/context/AppContext.jsx').readlines()
for i in range(50, 62):
    print(f'{i+1}: {lines[i]}', end='')